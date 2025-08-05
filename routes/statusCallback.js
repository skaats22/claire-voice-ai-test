// routes/statusCallback.js
const queueManager = require('../queueManager');

module.exports = (req, res) => {
  const eventType = req.body?.webhook_payload?.data?.event_type || 'unknown';
  console.log('📞 Call status update:', eventType);

  if (eventType === 'call.hangup' || eventType === 'call.ended') {
    queueManager.notifyCallEnded();
  }

  res.sendStatus(200);
};
