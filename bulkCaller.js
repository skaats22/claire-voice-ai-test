require('dotenv').config();
const axios = require('axios');
const customers = require('./customers');
const pLimit = require('p-limit');

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;
const ACCOUNT_SID = 'ce3abd6a-bbc4-4b1c-b3c8-3a5210e725f6';
const APPLICATION_SID = '2741690567753729623';
const FROM_NUMBER = '+18887600227';

const DYNAMIC_URL = 'https://9d89dfb387ad.ngrok-free.app/dynamic-variables';
const STATUS_CALLBACK = 'https://9d89dfb387ad.ngrok-free.app/status-callback';

const DRY_RUN = true;  // Toggle this to false to place real calls
const limit = pLimit(10);

async function makeCall(customer) {
  if (DRY_RUN) {
    console.log(`[DRY RUN] Pretending to call ${customer.first_name} (${customer.phone_number})`);
    return Promise.resolve();
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
    console.log(`📞 Call started for ${customer.first_name} (${customer.phone_number})`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error calling ${customer.first_name}:`, error.response?.data || error.message);
  }
}

async function runBulkCalls() {
  const tasks = customers.map(customer => limit(() => makeCall(customer)));
  await Promise.all(tasks);
  console.log('🎉 All calls launched!');
}

runBulkCalls();
