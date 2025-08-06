// routes/logInteraction.js
const fs = require('fs');
const path = require('path');
const csvFilePath = path.join(__dirname, '..', 'call_logs.csv');

// CSV headers
const headers = [
  'first_name',
  'last_name',
  'phone_number',
  'call_outcome',
  'transfer_reason',
  'intent_to_pay',
  'intent_to_pay_date',
  'follow_up',
  'summary',
  'date',
  'time'
];

// Initialize CSV if missing
if (!fs.existsSync(csvFilePath)) {
  fs.writeFileSync(csvFilePath, headers.join(',') + '\n');
}

module.exports = (req, res) => {
  const {
    first_name,
    last_name,
    phone_number,
    call_outcome,
    transfer_reason,
    intent_to_pay,
    intent_to_pay_date,
    follow_up,
    summary
  } = req.body;

  if (!first_name || !last_name || !phone_number || !call_outcome) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const now = new Date();
  const date = now.toLocaleDateString('en-US');
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase();

  const row = [
    first_name,
    last_name,
    phone_number,
    call_outcome,
    transfer_reason || '',
    intent_to_pay === true ? 'true' : 'false',
    intent_to_pay_date || '',
    follow_up || '',
    summary || '',
    date,
    time
  ].map(val => `"${(val || '').toString().replace(/"/g, '""')}"`).join(',') + '\n';

  fs.appendFile(csvFilePath, row, err => {
    if (err) {
      console.error('❌ Failed to write log:', err);
      return res.status(500).json({ message: 'Failed to write log' });
    }

    res.status(200).json({ message: '✅ Call logged successfully' });
  });
};
