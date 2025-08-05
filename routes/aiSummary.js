const express = require('express');
const router = express.Router();
const callStatusMap = require('../callStatusStore');
const { writeToCSV, prepareRowFromCallInfo, shouldSkip } = require('../utils/logUtils');

router.post('/ai-summary', (req, res) => {
  const {
    call_id,       // your custom call ID or callSid
    summary,
    intent_to_pay,
    pay_date,
    follow_up_date,
    agent_outcome,
    transfer_reason,
  } = req.body;

  if (!call_id) {
    return res.status(400).send('Missing call_id');
  }

  const callInfo = callStatusMap.get(call_id);

  if (!callInfo) {
    return res.status(404).send('Call info not found');
  }

  // Update call info with AI data
  callInfo.summary = summary || callInfo.summary || '';
  callInfo.intent_to_pay = intent_to_pay ?? callInfo.intent_to_pay ?? false;
  callInfo.pay_date = pay_date || callInfo.pay_date || '';
  callInfo.follow_up_date = follow_up_date || callInfo.follow_up_date || '';
  callInfo.agent_outcome = agent_outcome || callInfo.agent_outcome || '';
  callInfo.transfer_reason = transfer_reason || callInfo.transfer_reason || '';

  callStatusMap.set(call_id, callInfo);

  // If call already ended and not logged yet, log now
  if (callInfo.telnyx_status === 'completed' && !callInfo.logged && !shouldSkip(callInfo.summary)) {
    const row = prepareRowFromCallInfo(callInfo);
    writeToCSV(row);
    callInfo.logged = true;
    callStatusMap.set(call_id, callInfo);
    console.log(`✅ Logged call after AI summary received: ${call_id}`);
  } else {
    console.log(`ℹ️ Received AI summary for call ${call_id}, call not ended or already logged.`);
  }

  res.sendStatus(200);
});

module.exports = router;
