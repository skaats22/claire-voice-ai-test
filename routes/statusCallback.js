const callStatusMap = require('../callStatusStore');
const queueManager = require('../queueManager'); // for notifyCallEnded()

module.exports = (req, res) => {
  const body = req.body;
  console.log('Webhook body:', body);

  // The CallSid identifying the call
  const callSid = body.CallSid || body.callSid || (body.data && body.data.id);

  if (!callSid) {
    console.warn('No CallSid in callback');
    return res.sendStatus(400);
  }

  // Find the stored call info for this callSid
  const callEntry = callStatusMap.get(callSid);

  if (!callEntry) {
    console.warn(`No call info found for CallSid: ${callSid}`);
    return res.sendStatus(404);
  }

  // Update call info from webhook data
  callEntry.call_outcome = body.CallStatus || callEntry.call_outcome || '';
  callEntry.call_duration = body.CallDuration || callEntry.call_duration || '';
  callEntry.hangup_source = body.HangupSource || callEntry.hangup_source || '';
  callEntry.timestamp = new Date().toISOString();

  // Save updated entry back
  callStatusMap.set(callSid, callEntry);

  // If call is completed or failed, mark call ended and start next calls
  if (['completed', 'no-answer', 'busy', 'failed', 'canceled'].includes(body.CallStatus)) {
    queueManager.notifyCallEnded();
    console.log(`📴 Call ended: ${callSid}, outcome: ${body.CallStatus}`);
  }

  res.sendStatus(200);
};
