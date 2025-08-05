const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
const customers = require('../customers');

app.use(bodyParser.json());

const CLAIRE_ASSISTANT_ID = 'assistant-4dea34d6-e2d8-4307-95b5-6c0a489d473a';

let currentIndex = 0;
const conversationToCustomerMap = new Map();

// === Voice Webhook for Claire (English) ===
app.post('/voice-webhook', (req, res) => {
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

  const greeting_text = `Hi ${customer.first_name}, this is Claire, I'm an AI Agent calling from ${customer.dealer_name}. 
  I'm reaching out to remind you of your upcoming payment of $${customer.amount_due} for your ${customer.car_year} ${customer.car_make} ${customer.car_model}. 
  If now's a good time, I'd be happy to help you with your payment—or we can set up a time that works better for you. Diga Español para cambiar al español.`;


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

  res.json(response);

});


// === Log Interactions for Both Assistants ===
app.post('/log-interaction', (req, res) => {
  console.log('📦 Full payload received:\n', JSON.stringify(req.body, null, 2));

  const raw = req.body?.webhook_payload?.data || req.body?.payload || {};
  const results = raw.results || [];
  const conversation_id = raw.conversation_id || null;
  const metadata = raw.metadata || {};
  const fallbackPhone = metadata?.to;

  let customer = conversationToCustomerMap.get(conversation_id);
  if (!customer && fallbackPhone) {
    customer = Object.values(customers).find(c => c.phone_number === fallbackPhone);
    if (customer) {
      console.warn(`⚠️ Used phone number fallback to find customer for conversation_id ${conversation_id}`);
    }
  }

  let summary = '';
  let intent_to_pay = false;
  let intent_to_pay_date = null;
  let follow_up = null;
  let call_outcome = null;
  let transfer_reason = null;

  if (Array.isArray(results)) {
    let firstResult = {};
    if (results[0]?.result) {
      try {
        firstResult = JSON.parse(results[0].result);
      } catch (err) {
        console.warn('⚠️ Could not parse first result as JSON.', err);
      }
    }

    intent_to_pay = firstResult?.intent_to_pay || false;
    intent_to_pay_date = firstResult?.intent_to_pay_date || null;
    follow_up = firstResult?.follow_up || null;
    call_outcome = firstResult?.call_outcome || null;
    transfer_reason = firstResult?.transfer_reason || null;

    if (results[1]?.result) {
      try {
        const secondResultParsed = JSON.parse(results[1].result);
        summary = secondResultParsed?.summary || results[1].result;
      } catch {
        summary = results[1].result;
      }
    }
  }

  const call_timestamp = raw.timestamp || raw.created_at || new Date().toISOString();

  console.log({
    conversation_id,
    phone: customer?.phone_number || 'unknown',
    summary,
    intent_to_pay,
    intent_to_pay_date,
    follow_up,
    call_outcome,
    transfer_reason,
    timestamp: call_timestamp
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
