const express = require('express');
const router = express.Router();
const callStatusMap = require('../callStatusStore');
const queueManager = require('../queueManager');
const { writeToCSV, prepareRowFromCallInfo } = require('../utils/logUtils'); // we'll create utils

router.post('/status-callback', (req, res) => {
  const body = req.body;
  const callSid = body.CallSid || body.call_control_id || 'unknown';
  const callInfo = callStatusMap.get(callSid);

  if (!callInfo) {
    console.warn(`⚠️ No call info found for CallSid: ${callSid}`);
    return res.sendStatus(404);
  }

  callInfo.telnyx_status = body.CallStatus || callInfo.telnyx_status;
  callInfo.call_duration = body.CallDuration || callInfo.call_duration || '';
  callInfo.hangup_source = body.HangupSource || callInfo.hangup_source || '';
  callInfo.timestamp = new Date().toISOString();

  callStatusMap.set(callSid, callInfo);

  // Notify queue manager on call end states
  if (['completed', 'no-answer', 'busy', 'failed', 'canceled'].includes(callInfo.telnyx_status)) {
    queueManager.notifyCallEnded();
    console.log(`📴 Call ended: ${callSid}, Telnyx status: ${callInfo.telnyx_status}`);
  }

  // **DO NOT log here — wait for AI summary**

  res.sendStatus(200);
});

module.exports = router;
