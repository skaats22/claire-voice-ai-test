const axios = require('axios');
const customers = require('./customers');

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;
const ACCOUNT_SID = process.env.ACCOUNT_SID || 'ce3abd6a-bbc4-4b1c-b3c8-3a5210e725f6';
const APPLICATION_SID = process.env.APPLICATION_SID || '2741690567753729623';
const FROM_NUMBER = process.env.FROM_NUMBER || '+18887600227';

const NGROK_URL = process.env.NGROK_URL;
const DYNAMIC_URL = `${NGROK_URL}/dynamic-variables`;
const STATUS_CALLBACK = `${NGROK_URL}/status-callback`;

const MAX_CONCURRENT_CALLS = 10;
const DRY_RUN = true;

let activeCalls = 0;
const queue = [...customers];

async function placeCall(customer) {
  if (DRY_RUN) {
    console.log(`[DRY RUN] Pretending to call ${customer.first_name} (${customer.phone_number})`);
    activeCalls++;

    setTimeout(() => {
      console.log(`[DRY RUN] Simulated call ended for ${customer.first_name}`);
      notifyCallEnded();
    }, 2000); // Simulated 2 second call duration

    return;
  }

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

    activeCalls++;
    console.log(`📞 Real call started: ${customer.first_name}`);
  } catch (error) {
    console.error(`❌ Failed to call ${customer.first_name}:`, error.response?.data || error.message);
  }
}

function maybeStartNewCalls() {
  while (activeCalls < MAX_CONCURRENT_CALLS && queue.length > 0) {
    const customer = queue.shift();
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
