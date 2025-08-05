// routes/dashboard.js
const callStatusMap = require('../callStatusStore');

function formatDateTime(timestamp) {
  if (!timestamp) return ['', ''];

  const dateObj = new Date(timestamp);
  if (isNaN(dateObj)) return ['', ''];

  // Format date as MM/DD/YYYY
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const day = dateObj.getDate().toString().padStart(2, '0');
  const year = dateObj.getFullYear();

  const formattedDate = `${month}/${day}/${year}`;

  // Format time as HH:MM am/pm
  let hours = dateObj.getHours();
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12; // convert 0 to 12

  const formattedTime = `${hours}:${minutes} ${ampm}`;

  return [formattedDate, formattedTime];
}

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
        <th>Date</th>
        <th>Time</th>
      </tr>
  `;

  for (const entry of callStatusMap.values()) {
    const [date, time] = formatDateTime(entry.timestamp);

    html += `
      <tr>
        <td>${entry.phone}</td>
        <td>${entry.intent_to_pay}</td>
        <td>${entry.intent_to_pay_date || ''}</td>
        <td>${entry.follow_up || ''}</td>
        <td>${entry.call_outcome || ''}</td>
        <td>${entry.transfer_reason || ''}</td>
        <td>${entry.summary || ''}</td>
        <td>${date}</td>
        <td>${time}</td>
      </tr>
    `;
  }

  html += '</table>';
  res.send(html);
};
