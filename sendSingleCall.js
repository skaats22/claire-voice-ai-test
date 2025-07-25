require('dotenv').config();
const axios = require('axios');
const customers = require('./customers'); // <-- Import customers list

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;
const ACCOUNT_SID = 'ce3abd6a-bbc4-4b1c-b3c8-3a5210e725f6';
const APPLICATION_SID = '2741690567753729623';
const FROM_NUMBER = '+18887600227';

// Replace with your own tunnel URLs for your server endpoints
const DYNAMIC_URL = 'https://f8cbb90093fc.ngrok-free.app/dynamic-variables'; 
const STATUS_CALLBACK = 'https://f8cbb90093fc.ngrok-free.app/status-callback';

// Get the first customer from the list
const customer = customers[0];

async function makeCall() {
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

    console.log('📞 Call initiated:', response.data);
  } catch (error) {
    console.error('❌ Error initiating call:', error.response?.data || error.message);
  }
}

makeCall();