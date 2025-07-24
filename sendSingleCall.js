// sendCall.js
require('dotenv').config();
const axios = require('axios');
const customer = require('./server')

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;
const ACCOUNT_SID = 'ce3abd6a-bbc4-4b1c-b3c8-3a5210e725f6';
const APPLICATION_SID = '2741690567753729623';
const FROM_NUMBER = '+18887600227';

// NOTE: Replace the URLS below with your own tunnel URLs
// These URLs are temporary and tied to my local environment
const DYNAMIC_URL = 'https://43ef4784155f.ngrok-free.app/dynamic-variables'; 
const STATUS_CALLBACK = 'https://43ef4784155f.ngrok-free.app/status-callback';

// This function makes an actual phone call from Claire to customer.phone_number
// Initiated by command: node sendCalls.js
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
