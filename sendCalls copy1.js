// sendCalls.js
require('dotenv').config();
const axios = require('axios');
const { callEvents, customers } = require('./server'); // import from server.js

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;
const ACCOUNT_SID = 'ce3abd6a-bbc4-4b1c-b3c8-3a5210e725f6';
const APPLICATION_SID = '2741690567753729623';
const FROM_NUMBER = '+18887600227';
const DYNAMIC_URL = 'https://dac56e285b1b.ngrok-free.app/dynamic-variables';
const STATUS_CALLBACK = 'https://dac56e285b1b.ngrok-free.app/status-callback';

async function waitForCallCompletion(callId) {
  return new Promise(resolve => {
    callEvents.once(`callCompleted:${callId}`, () => {
      resolve();
    });
  });
}

async function sendCalls() {
  for (const customer of customers) {
    const payload = {
      ApplicationSid: APPLICATION_SID,
      To: customer.phone_number,
      From: FROM_NUMBER,
      DynamicVariablesUrl: DYNAMIC_URL,
      DynamicVariablesMethod: "POST",
      StatusCallback: STATUS_CALLBACK,
      StatusCallbackMethod: "POST"
    };

    try {
      console.log(`📞 Calling ${customer.first_name} at ${customer.phone_number}...`);

      const response = await axios.post(
        `https://api.telnyx.com/v2/texml/Accounts/${ACCOUNT_SID}/Calls`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${TELNYX_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.dir(response.data, { depth: null });

      const callId = response?.data?.sid;

      if (!callId) {
        console.warn(`⚠️ No call_control_id returned for ${customer.first_name}`);
        continue;
      }

      console.log(`✅ Call initiated to ${customer.first_name}. Waiting for call ${callId} to finish...`);
      await waitForCallCompletion(callId);
      console.log(`✅ Call completed for ${customer.first_name}\n`);

    } catch (error) {
      console.error(`❌ Error calling ${customer.first_name}:`, error.response?.data || error.message);
    }
  }

  console.log('📞 All calls completed');
}

sendCalls();
