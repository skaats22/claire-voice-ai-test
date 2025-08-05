const axios = require('axios');

const NGROK_URL = process.env.NGROK_URL;
const DYNAMIC_URL = `${NGROK_URL}/dynamic-variables`;
const STATUS_CALLBACK = `${NGROK_URL}/status-callback`;

async function simulateWebhook() {
  const webhookUrl = STATUS_CALLBACK;

  // Sample mock payload mimicking a Telnyx call status event
  const mockPayload = {
    webhook_payload: {
      data: {
        event_type: "call.answered",
        conversation_id: "mock-convo-12345",
        timestamp: new Date().toISOString(),
        call_control_id: "mock-call-id-6789"
      }
    }
  };

  try {
    const response = await axios.post(webhookUrl, mockPayload);
    console.log('✅ Webhook simulated successfully:', response.status);
  } catch (error) {
    console.error('❌ Error simulating webhook:', error.message);
  }
}

simulateWebhook();
