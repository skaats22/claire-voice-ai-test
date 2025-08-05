require('dotenv').config();
const axios = require('axios');
const customers = require('../customers');

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;
const ACCOUNT_SID = 'ce3abd6a-bbc4-4b1c-b3c8-3a5210e725f6';  // replace with your actual Account SID
const APPLICATION_SID = '2741690567753729623'; // your Voice API App SID
const FROM_NUMBER = '+18887600227'; // your Telnyx number

// Replace with your own ngrok or deployed URLs
const DYNAMIC_URL = 'https://7251fac567de.ngrok-free.app/dynamic-variables'; 
const STATUS_CALLBACK = 'https://7251fac567de.ngrok-free.app/status-callback';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeCallForCustomer(customer) {
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

    console.log(`📞 Call initiated for ${customer.first_name} (${customer.phone_number}):`, response.data);
  } catch (error) {
    console.error(`❌ Error initiating call for ${customer.first_name} (${customer.phone_number}):`, error.response?.data || error.message);
  }
}

async function callAllCustomers() {
  for (const customer of customers) {
    await makeCallForCustomer(customer);
    console.log(`Waiting 30 seconds before next call...`);
    await delay(30000); // wait 30 seconds between calls
  }
  console.log('✅ All calls processed.');
}

callAllCustomers();