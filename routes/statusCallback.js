const queueManager = require('../queueManager');

module.exports = (req, res) => {
  console.log('Webhook body:', req.body);

  // Adjust these to match the actual payload keys you received:
  const callStatus = req.body.CallStatus;
  const callSid = req.body.CallSid;

  if (callStatus === 'completed') {
    console.log(`📴 Call completed received for ${callSid}`);
    queueManager.notifyCallEnded();
  }

  res.sendStatus(200);
};