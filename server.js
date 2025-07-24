// server.js
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;
const customers = require('./customers');
const assistantMap = new Map();

app.use(bodyParser.json());

const ENGLISH_ASSISTANT_ID = 'assistant-4dea34d6-e2d8-4307-95b5-6c0a489d473a';
const SPANISH_ASSISTANT_ID = 'assistant-928d797f-6b4b-4c60-9668-79ee69b12e0f';

// Voice Webhook endpoint
app.post('/voice-webhook', (req, res) => {
  const sessionId = req.body.CallSid || req.body.call_session_id;
  const assistantId = assistantMap.get(sessionId) || ENGLISH_ASSISTANT_ID;

  const teXML = `
    <Response>
      <AI>
        <Assistant id="${assistantId}" />
      </AI>
    </Response>
  `;
  res.type('application/xml').send(teXML.trim());
});

// Dynamic Variables and Language Mapping
let currentIndex = 0;

app.post('/dynamic-variables', (req, res) => {
  const customer = customers[currentIndex];
  currentIndex = (currentIndex + 1) % customers.length;

  const sessionId = req.body.call?.call_session_id || req.body.CallSid;
  const lang = (customer.preferred_language || 'en').toLowerCase();

  const assistantId = (lang === 'es' || lang === 'spanish')
    ? SPANISH_ASSISTANT_ID
    : ENGLISH_ASSISTANT_ID;

  if (sessionId) {
    assistantMap.set(sessionId, assistantId);
    setTimeout(() => assistantMap.delete(sessionId), 10 * 60 * 1000); // Cleanup after 10 min
  }

  const greeting_text = `Hi ${customer.first_name}, this is Claire from ${customer.dealer_name}. I'm reaching out to remind you of your upcoming payment of $${customer.amount_due} for your ${customer.car_year} ${customer.car_make} ${customer.car_model}. If now's a good time, I'd be happy to help you with your payment—or we can set up a time that works better for you. How does that sound? Si prefiere español, diga “Español.”`;

  console.log(`✅ Sending dynamic variables for customer ${customer.first_name}`);

  return res.json({
    dynamic_variables: {
      ...customer,
      greeting_text,
    }
  });
});

// Endpoint to switch assistants mid-call (e.g., from English to Spanish)
app.post('/switch-language', (req, res) => {
  const sessionId = req.body.call_session_id || req.body.CallSid;
  const newLang = req.body.language;

  if (!sessionId || !newLang) {
    return res.status(400).json({ error: 'Missing sessionId or language' });
  }

  const assistantId = (newLang.toLowerCase() === 'es' || newLang.toLowerCase() === 'spanish')
    ? SPANISH_ASSISTANT_ID
    : ENGLISH_ASSISTANT_ID;

  assistantMap.set(sessionId, assistantId);
  console.log(`🔄 Switched assistant for session ${sessionId} to ${newLang}`);

  res.sendStatus(200);
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
