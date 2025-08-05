// logInteraction.js
const fs = require('fs');
const path = require('path');
const customers = require('./customers');
const callStatusMap = require('./callStatusStore');

const csvFilePath = path.join(__dirname, 'call_logs.csv');

if (!fs.existsSync(csvFilePath)) {
  fs.writeFileSync(
    csvFilePath,
    'timestamp,conversation_id,phone,intent_to_pay,intent_to_pay_date,follow_up,call_outcome,transfer_reason,summary\n'
  );
}

const conversationToCustomerMap = new Map();

module.exports = (req, res) => {
  const raw = req.body?.webhook_payload?.data || req.body?.payload || {};
  const results = raw.results || [];
  const conversation_id = raw.conversation_id || null;
  const metadata = raw.metadata || {};
  const fallbackPhone = metadata?.to;

  let customer = conversationToCustomerMap.get(conversation_id);
  if (!customer && fallbackPhone) {
    customer = customers.find(c => c.phone_number === fallbackPhone);
    if (customer) {
      conversationToCustomerMap.set(conversation_id, customer);
    }
  }

  let summary = '';
  let intent_to_pay = false;
  let intent_to_pay_date = null;
  let follow_up = null;
  let call_outcome = null;
  let transfer_reason = null;

  if (Array.isArray(results)) {
    let firstResult = {};
    if (results[0]?.result) {
      try {
        firstResult = JSON.parse(results[0].result);
      } catch {}
    }

    intent_to_pay = firstResult?.intent_to_pay || false;
    intent_to_pay_date = firstResult?.intent_to_pay_date || null;
    follow_up = firstResult?.follow_up || null;
    call_outcome = firstResult?.call_outcome || null;
    transfer_reason = firstResult?.transfer_reason || null;

    if (results[1]?.result) {
      try {
        const secondResultParsed = JSON.parse(results[1].result);
        summary = secondResultParsed?.summary || results[1].result;
      } catch {
        summary = results[1].result;
      }
    }
  }

  const call_timestamp = raw.timestamp || raw.created_at || new Date().toISOString();
  const phone = customer?.phone_number || fallbackPhone || 'unknown';

  // Update in-memory map for dashboard
  callStatusMap.set(conversation_id || phone, {
    phone,
    conversation_id,
    intent_to_pay,
    intent_to_pay_date,
    follow_up,
    call_outcome,
    transfer_reason,
    summary,
    timestamp: call_timestamp
  });

  // Append CSV
  const row = [
    call_timestamp,
    conversation_id,
    phone,
    intent_to_pay,
    intent_to_pay_date,
    follow_up,
    call_outcome,
    transfer_reason,
    `"${summary.replace(/"/g, '""')}"`
  ].join(',') + '\n';

  fs.appendFileSync(csvFilePath, row);

  res.sendStatus(200);
};
