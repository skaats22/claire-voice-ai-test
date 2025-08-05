const fs = require('fs');
const path = require('path');
const csvFilePath = path.join(__dirname, '..', 'call_logs.csv');

function formatDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return ['', ''];
  // You already have date and time formatted from CSV, so just return them.
  return [dateStr, timeStr];
}

module.exports = (req, res) => {
  if (!fs.existsSync(csvFilePath)) {
    return res.send('<p>No call logs found yet.</p>');
  }

  const csvData = fs.readFileSync(csvFilePath, 'utf8');
  const lines = csvData.trim().split('\n');
  const headers = lines.shift().split(',');

  let html = `
    <h1>📞 Live Call Results Dashboard</h1>
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
      <tr>
        ${headers.map(h => `<th>${h}</th>`).join('')}
      </tr>
  `;

  for (const line of lines) {
    // Basic CSV parse (fragile, but let's keep it simple)
    const values = line.match(/("([^"]|"")*"|[^,]+)/g).map(val => val.replace(/^"|"$/g, '').replace(/""/g, '"'));

    // Map values to headers for clarity
    const rowData = {};
    headers.forEach((header, i) => {
      rowData[header.trim()] = values[i] || '';
    });

    // Use Date and Time from CSV as timestamp columns
    const [date, time] = formatDateTime(rowData['Date'], rowData['Time']);

    html += `
      <tr>
        <td>${rowData['Call ID']}</td>
        <td>${rowData['First Name']}</td>
        <td>${rowData['Last Name']}</td>
        <td>${rowData['Phone']}</td>
        <td>${rowData['Intent to Pay']}</td>
        <td>${rowData['Pay Date']}</td>
        <td>${rowData['Follow Up']}</td>
        <td>${rowData['Agent Outcome']}</td>
        <td>${rowData['Call Status']}</td>
        <td>${rowData['Transfer Reason']}</td>
        <td style="max-width: 300px; white-space: normal;">${rowData['Summary']}</td>
        <td>${date}</td>
        <td>${time}</td>
      </tr>
    `;
  }

  html += '</table>';
  res.send(html);
};
