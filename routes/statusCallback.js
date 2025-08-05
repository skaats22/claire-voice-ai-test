const queueManager = require('../queueManager');

module.exports = (req, res) => {
  const eventType = req.body?.webhook_payload?.data?.event_type || '';
  console.log('Webhook event:', eventType);

  if (['call.ended', 'call.hangup', 'call.completed'].includes(eventType)) {
    queueManager.notifyCallEnded();
  }

  res.sendStatus(200);
};
