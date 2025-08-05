// routes/dashboard.js
const callStatusMap = require('../callStatusStore');

console.log('📊 Current logs:', [...callStatusMap.values()]);

module.exports = (req, res) => {
  let html = `
    <h1>📞 Live Call Results Dashboard</h1>
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
      <tr>
        <th>Phone</th>
        <th>Intent to Pay</th>
        <th>Pay Date</th>
        <th>Follow Up</th>
        <th>Outcome</th>
        <th>Transfer Reason</th>
        <th>Summary</th>
        <th>Timestamp</th>
      </tr>
  `;

  for (const entry of callStatusMap.values()) {
    html += `
      <tr>
        <td>${entry.phone}</td>
        <td>${entry.intent_to_pay}</td>
        <td>${entry.intent_to_pay_date || ''}</td>
        <td>${entry.follow_up || ''}</td>
        <td>${entry.call_outcome || ''}</td>
        <td>${entry.transfer_reason || ''}</td>
        <td>${entry.summary || ''}</td>
        <td>${entry.timestamp}</td>
      </tr>
    `;
  }

  html += '</table>';
  res.send(html);
};
