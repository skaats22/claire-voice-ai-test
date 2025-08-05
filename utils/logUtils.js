const fs = require('fs');
const path = require('path');

const LOG_PATH = path.join(__dirname, '..', 'call_logs.csv');

if (!fs.existsSync(LOG_PATH)) {
  fs.writeFileSync(
    LOG_PATH,
    'Call ID,First Name,Last Name,Phone,Intent to Pay,Pay Date,Follow Up,Agent Outcome,Call Status,Transfer Reason,Summary,Date,Time\n',
    'utf8'
  );
}

function sanitize(val) {
  if (val === undefined || val === null) return '';
  return String(val).replace(/,/g, ''); // remove commas so CSV doesn't break
}

function writeToCSV(row) {
  const line = [
    row.call_id,
    row.first_name,
    row.last_name,
    row.phone,
    row.intent_to_pay,
    row.pay_date,
    row.follow_up_date,
    row.agent_outcome,
    row.call_status,
    row.transfer_reason,
    row.summary,
    row.date,
    row.time,
  ].map(sanitize).join(',') + '\n';

  fs.appendFileSync(LOG_PATH, line, 'utf8');
}

function shouldSkip(summary) {
  if (!summary) return true;
  const lower = summary.toLowerCase();
  return (
    lower.includes("there is no conversation to summarize") ||
    lower.includes("no key facts") ||
    lower.includes("our conversation has just started")
  );
}

function normalizeOutcome(raw = '') {
  const lower = raw.toLowerCase();
  if (lower.includes('intent')) return 'intent_date_collected';
  if (lower.includes('follow')) return 'follow_up_scheduled';
  if (lower.includes('transfer')) return 'transfer_to_live_agent';
  if (lower.includes('wrong')) return 'wrong_number';
  if (lower.includes('self_service')) return 'self_service_intent';
  return raw;
}

function normalizeTransferReason(reason = '', summary = '') {
  if (reason) return reason;
  if (summary.includes('lawyer')) return 'sensitive_case';
  if (summary.includes('speak') && summary.includes('Spanish')) return 'language_escalation';
  if (summary.includes('six weeks')) return 'vague_long_term_response';
  return '';
}

function prepareRowFromCallInfo(callInfo) {
  const now = new Date();
  const formattedDate = now.toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' });
  const formattedTime = now.toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles' });

  return {
    call_id: callInfo.custom_call_id || callInfo.call_sid || '',
    first_name: callInfo.first_name || '',
    last_name: callInfo.last_name || '',
    phone: callInfo.phone || '',
    intent_to_pay: callInfo.intent_to_pay || false,
    pay_date: callInfo.pay_date || '',
    follow_up_date: callInfo.follow_up_date || '',
    agent_outcome: normalizeOutcome(callInfo.agent_outcome),
    call_status: callInfo.telnyx_status || 'completed',
    transfer_reason: normalizeTransferReason(callInfo.transfer_reason, callInfo.summary || ''),
    summary: callInfo.summary || '',
    date: formattedDate,
    time: formattedTime,
  };
}

module.exports = {
  writeToCSV,
  shouldSkip,
  prepareRowFromCallInfo,
};
