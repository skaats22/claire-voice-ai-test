const queueManager = require('../queueManager');

module.exports = (req, res) => {
  const eventType = req.body?.data?.event_type;

  if (eventType === 'call.hangup') {
    console.log('📴 Call hangup event received');
    queueManager.notifyCallEnded();
  }

  res.sendStatus(200);
};
