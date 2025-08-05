// queueManager.js
require('dotenv').config();
const axios = require('axios');
const customers = require('../../customers');
const callStatusMap = require('../../callStatusStore'); // your call info store

// Env variables
const TELNYX_API_KEY = process.env.TELNYX_API_KEY;
const ACCOUNT_SID = process.env.ACCOUNT_SID;
const APPLICATION_SID = process.env.APPLICATION_SID;
const FROM_NUMBER = process.env.FROM_NUMBER;
const NGROK_URL = process.env.NGROK_URL;

const DYNAMIC_URL = `${NGROK_URL}/dynamic-variables`;
const STATUS_CALLBACK = `${NGROK_URL}/status-callback`;

const MOCK_MODE = false; // 👈 Set to false when you're ready for real calls

const MAX_CONCURRENT_CALLS = parseInt(process.env.CONCURRENT_LIMIT, 10) || 1;

let activeCalls = 0;
const queue = [...customers]; // clone customer list on start

async function placeCall(customer) {
  if (MOCK_MODE) {
    const mockCallSid = `mock-${Date.now()}`;

    callStatusMap.set(mockCallSid, {
      customer_id: customer.id,
      phone_number: customer.phone_number,
      first_name: customer.first_name,
      last_name: customer.last_name,
      timestamp: new Date().toISOString(),
    });

    console.log(`🧪 MOCK: Simulating call for ${customer.first_name}`);

    setTimeout(() => {
      axios.post(`${NGROK_URL}/status-callback`, {
        CallSid: mockCallSid,
        CallDuration: '42',
        CallStatus: 'completed',
        HangupSource: 'callee',
      }).catch(err => {
        console.error('❌ Failed to post mock webhook:', err.message);
      });
    }, 1000);

    return;
  }

  const payload = {
    ApplicationSid: APPLICATION_SID,
    To: customer.phone_number,
    From: FROM_NUMBER,
    DynamicVariablesUrl: DYNAMIC_URL,
    DynamicVariablesMethod: 'POST',
    StatusCallback: STATUS_CALLBACK,
    StatusCallbackMethod: 'POST',
    Metadata: {
      customer_id: customer.id
    }
  };

  try {
    const response = await axios.post(
      `https://api.telnyx.com/v2/texml/Accounts/${ACCOUNT_SID}/Calls`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${TELNYX_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('API call response data:', response.data);
    const callSid = response.data?.sid;


    if (!callSid) {
      console.warn('No CallSid returned from Telnyx API');
    } else {
      callStatusMap.set(callSid, {
        customer_id: customer.id,
        phone: customer.phone_number,
        first_name: customer.first_name,
        last_name: customer.last_name,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`📞 Real call started: ${customer.first_name}`);
  } catch (error) {
    console.error(`❌ Failed to call ${customer.first_name}:`, error.response?.data || error.message);
    notifyCallEnded(); // Allow next calls to proceed on failure
  }
}

function maybeStartNewCalls() {
  while (activeCalls < MAX_CONCURRENT_CALLS && queue.length > 0) {
    const customer = queue.shift();
    console.log('📞 Attempting call to:', customer.first_name, customer.phone_number);
    activeCalls++;
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

function resetQueue() {
  queue.length = 0;
  queue.push(...customers);
  activeCalls = 0;
}

module.exports = {
  maybeStartNewCalls,
  notifyCallEnded,
  resetQueue,
};
