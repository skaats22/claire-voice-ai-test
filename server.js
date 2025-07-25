const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
const customers = require('./customers');

app.use(bodyParser.json());

const CLAIRE_ASSISTANT_ID = 'assistant-4dea34d6-e2d8-4307-95b5-6c0a489d473a';
const CAMILA_ASSISTANT_ID = 'assistant-928d797f-6b4b-4c60-9668-79ee69b12e0f';
const CAMILA_PHONE_NUMBER = '+18887600248';

let currentIndex = 0;
const conversationToCustomerMap = new Map();

// === Voice Webhook for Claire (English) ===
app.post('/voice-webhook-claire', (req, res) => {
  const conversation_id = req.body?.conversation_id;

  // Serve Claire's assistant
  const teXML = `
    <Response>
      <AI>
        <Assistant id="${CLAIRE_ASSISTANT_ID}" />
      </AI>
    </Response>
  `;

  console.log(`🗣️ Serving Claire for conversation ${conversation_id}`);
  res.type('application/xml').send(teXML.trim());
});

// === Voice Webhook for Camila (Spanish) ===
app.post('/voice-webhook-camila', (req, res) => {
  const conversation_id = req.body?.conversation_id;

  // Serve Camila's assistant
  const teXML = `
    <Response>
      <AI>
        <Assistant id="${CAMILA_ASSISTANT_ID}" />
      </AI>
    </Response>
  `;

  console.log(`🗣️ Serving Camila for conversation ${conversation_id}`);
  res.type('application/xml').send(teXML.trim());
});

app.post('/dynamic-variables', (req, res) => {
  const conversation_id = req.body?.conversation_id || null;

  let customer;
  if (conversation_id && conversationToCustomerMap.has(conversation_id)) {
    customer = conversationToCustomerMap.get(conversation_id);
  } else {
    customer = customers[currentIndex];
    currentIndex = (currentIndex + 1) % customers.length;
    if (conversation_id) conversationToCustomerMap.set(conversation_id, customer);
  }

  const greeting_text = `Hi ${customer.first_name}, this is Claire from ${customer.dealer_name}. I'm reaching out to remind you of your upcoming payment of $${customer.amount_due} for your ${customer.car_year} ${customer.car_make} ${customer.car_model}. If now's a good time, I'd be happy to help you with your payment—or we can set up a time that works better for you. Say 'Español' to switch to Spanish.`;

  // Detect if this request is for Camila (Spanish assistant)
  const assistantId = req.body?.assistant_id || '';
  const isCamila = assistantId === CAMILA_ASSISTANT_ID;

  // Construct response


  const response = {
    dynamic_variables: {
      ...customer,
      greeting_text,
    },
    conversation: {
      metadata: {
        telnyx_end_user_target: customer.phone_number,  // e.g. "+13109082230"
      }
    }
  };

  if (req.body?.webhook_payload?.data?.payload?.assistant_id === CAMILA_ASSISTANT_ID) {
    response.memory = {
      conversation_query: `metadata->telnyx_end_user_target=eq.${customer.phone_number}&limit=1&order=last_message_at.desc`
    };
  }

  res.json(response);

});



// === Log Interactions for Both Assistants ===
app.post('/log-interaction', (req, res) => {
  const payload = req.body?.webhook_payload?.data?.payload || {};
  const conversation_id = payload.conversation_id;

  let summary = '';
  let intent_to_pay = false;
  let intent_to_pay_date = null;
  let follow_up = null;

  if (Array.isArray(payload.results)) {
    try {
      const firstResult = JSON.parse(payload.results[0].result);
      const message = firstResult?.raw_user_message?.toLowerCase() || '';

      const languageTriggers = ['¿hablas español?', 'puedes hablar en español', 'español', 'habla español'];
      const languageSwitchRequested = languageTriggers.some(trigger => message.includes(trigger));

      if (languageSwitchRequested) {
        console.log(`🔁 Customer requested Spanish — transfer should be triggered by Telnyx UI or Assistant tools.`);
        console.log(`📞 Transfer target: ${CAMILA_PHONE_NUMBER}`);
      }

      intent_to_pay = firstResult.intent_to_pay;
      intent_to_pay_date = firstResult.intent_to_pay_date;
      follow_up = firstResult.follow_up;

      // Try parsing summary from second result
      if (payload.results[1]?.result) {
        try {
          const secondResultParsed = JSON.parse(payload.results[1].result);
          summary = secondResultParsed?.summary || payload.results[1].result;
        } catch {
          summary = payload.results[1].result;
        }
      }
    } catch (err) {
      console.error('❌ Failed to parse result:', err);
    }
  }

  const customer = conversationToCustomerMap.get(conversation_id) || {};
  console.log({
    conversation_id,
    phone: customer.phone_number || 'unknown',
    summary,
    intent_to_pay,
    intent_to_pay_date,
    follow_up,
    timestamp: new Date().toISOString()
  });

  res.sendStatus(200);
});

// === Optional: Status Callback for logging call status events ===
app.post('/status-callback', (req, res) => {
  const eventType = req.body?.webhook_payload?.data?.event_type || 'unknown';
  console.log('📞 Call status update:', eventType);
  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`🚀 Webhook server running on port ${port}`);
});
