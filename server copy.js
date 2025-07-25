// server.js
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
const customers = require('./customers');

app.use(bodyParser.json());

// Only one assistant ID now — bilingual assistant
const BILINGUAL_ASSISTANT_ID = 'assistant-4dea34d6-e2d8-4307-95b5-6c0a489d473a';

// Voice Webhook endpoint
app.post('/voice-webhook', (req, res) => {
  const teXML = `
    <Response>
      <AI>
        <Assistant id="${BILINGUAL_ASSISTANT_ID}" />
      </AI>
    </Response>
  `;
  res.type('application/xml').send(teXML.trim());
});

// Dynamic Variables
let currentIndex = 0;

app.post('/dynamic-variables', (req, res) => {
  const customer = customers[currentIndex];
  currentIndex = (currentIndex + 1) % customers.length;

  const greeting_text = `Hi ${customer.first_name}, this is Claire from ${customer.dealer_name}. I'm reaching out to remind you of your upcoming payment of $${customer.amount_due} for your ${customer.car_year} ${customer.car_make} ${customer.car_model}. If now's a good time, I'd be happy to help you with your payment—or we can set up a time that works better for you. How does that sound? Si prefiere español, diga “Español.”`;

  console.log(`✅ Sending dynamic variables for customer ${customer.first_name}`);

  return res.json({
    dynamic_variables: {
      ...customer,
      greeting_text,
    }
  });
});

// Status Callback endpoint
app.post('/status-callback', (req, res) => {
  console.log('📞 Call status update:', req.body?.data?.event_type);
  res.sendStatus(200);
});

// Log Interaction endpoint
app.post('/log-interaction', (req, res) => {
  console.log('🧠 Claire Insight Log raw payload:', JSON.stringify(req.body, null, 2));

  const payload = req.body.payload || {};
  const conversation_id = payload.conversation_id;

  let summary = '';
  let intent_to_pay = false;
  let intent_to_pay_date = null;
  let follow_up = null;

  if (Array.isArray(payload.results)) {
    try {
      const firstResult = JSON.parse(payload.results[0].result);
      intent_to_pay = firstResult.intent_to_pay;
      intent_to_pay_date = firstResult.intent_to_pay_date;
      follow_up = firstResult.follow_up;
    } catch (err) {
      console.error('❌ Failed to parse first result JSON:', err);
    }

    summary = payload.results[1]?.result || '';
  }

  console.log({
    conversation_id,
    summary,
    intent_to_pay,
    intent_to_pay_date,
    follow_up,
    timestamp: new Date().toISOString()
  });

  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`🚀 Webhook server listening on port ${port}`);
});
