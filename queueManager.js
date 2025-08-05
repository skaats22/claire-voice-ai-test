require('dotenv').config();
const axios = require('axios');
const customers = require('./customers'); // Make sure this has the current customer list

// Env variables
const TELNYX_API_KEY = process.env.TELNYX_API_KEY;
const ACCOUNT_SID = process.env.ACCOUNT_SID;
const APPLICATION_SID = process.env.APPLICATION_SID;
const FROM_NUMBER = process.env.FROM_NUMBER;
const NGROK_URL = process.env.NGROK_URL;

// Endpoints
const DYNAMIC_URL = `${NGROK_URL}/dynamic-variables`;
const STATUS_CALLBACK = `${NGROK_URL}/status-callback`;

// Concurrency control
const MAX_CONCURRENT_CALLS = parseInt(process.env.CONCURRENT_LIMIT, 10) || 1;

let activeCalls = 0;
const queue = [...customers]; // Copy of customer list

async function placeCall(customer) {
  const payload = {
    ApplicationSid: APPLICATION_SID,
    To: customer.phone_number,
    From: FROM_NUMBER,
    DynamicVariablesUrl: DYNAMIC_URL,
    DynamicVariablesMethod: 'POST',
    StatusCallback: STATUS_CALLBACK,
    StatusCallbackMethod: 'POST'
  };

  try {
    await axios.post(
      `https://api.telnyx.com/v2/texml/Accounts/${ACCOUNT_SID}/Calls`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${TELNYX_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`📞 Real call started: ${customer.first_name}`);
  } catch (error) {
    console.error(`❌ Failed to call ${customer.first_name}:`, error.response?.data || error.message);
    notifyCallEnded(); // If call fails, decrement and try next
  }
}

function maybeStartNewCalls() {
  while (activeCalls < MAX_CONCURRENT_CALLS && queue.length > 0) {
    const customer = queue.shift();
    activeCalls++; // Increment before async call
    placeCall(customer);
  }

  if (activeCalls === 0 && queue.length === 0) {
    console.log('✅ All calls completed!');
  }
}

function notifyCallEnded() {
  activeCalls = Math.max(0, activeCalls - 1);
  console.log(`☎️ Call ended. Active calls: ${activeCalls}`);
  maybeStartNewCalls();
}

module.exports = {
  maybeStartNewCalls,
  notifyCallEnded
};
