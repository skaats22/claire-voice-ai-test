// queueManager.js
require('dotenv').config();
const axios = require('axios');
const customers = require('./customers');
const callStatusMap = require('./callStatusStore');

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;
const ACCOUNT_SID = 'ce3abd6a-bbc4-4b1c-b3c8-3a5210e725f6';
const APPLICATION_SID = '2741690567753729623';
const FROM_NUMBER = '+18887600227';

const DYNAMIC_URL = 'https://9d89dfb387ad.ngrok-free.app/dynamic-variables';
const STATUS_CALLBACK = 'https://9d89dfb387ad.ngrok-free.app/status-callback';

const MAX_CONCURRENT_CALLS = 10;
let activeCalls = 0;
let queue = [...customers];

function getNextCustomer() {
  return queue.shift();
}

async function placeCall(customer) {
  if (!customer) return;

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
    console.log(`📞 Call started: ${customer.first_name} (${customer.phone_number})`);
  } catch (error) {
    console.error(`❌ Failed to call ${customer.first_name}:`, error.response?.data || error.message);
  }
}

async function maybeStartNewCalls() {
  const callsToStart = [];

  while (activeCalls < MAX_CONCURRENT_CALLS && queue.length > 0) {
    const customer = getNextCustomer();
    callsToStart.push(placeCall(customer));
  }

  await Promise.all(callsToStart);

  if (activeCalls === 0 && queue.length === 0) {
    console.log('✅ All calls completed!');
  }
}


function notifyCallEnded() {
  activeCalls = Math.max(activeCalls - 1, 0);
  maybeStartNewCalls();
}


module.exports = {
  maybeStartNewCalls,
  notifyCallEnded
};
