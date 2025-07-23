// server.js
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(bodyParser.json());

// Claire's Assistant ID
const ASSISTANT_ID = 'assistant-4dea34d6-e2d8-4307-95b5-6c0a489d473a';

// Single customer
const customer = {
  phone_number: "+1123456789",
  first_name: "Alice",
  car_year: "2018",
  car_make: "Toyota",
  car_model: "Camry",
  amount_due: "450.00",
  dealer_name: "Cavalier Motors",
  dealer_website: "www.pay.carpay.com",
  regular_amount_due: "0.00",
  pickups_due: "0.00",
  side_notes_due: "0.00",
  recurring_fees_due: "0.00",
  late_fees_due: "0.00",
  other_receivables_due: "0.00",
  live_agent_phone_number: "+1123456789",
  ivr_phone_number: "+18007654321",
  due_date: "2025-07-31",
  rfc_name: "RFC Finance",
  co_buyer_name: "John Doe",
  preferred_language: "es",
};

// Voice Webhook endpoint:
// Responds to Telnyx Voice API to initiate the AI assistant call.
// The Assistant ID must match the one configured in your Telnyx AI Assistant setup.
// Make sure this endpoint is reachable from Telnyx (use ngrok or deploy).
app.post('/voice-webhook', (req, res) => {
  const teXML = `
    <Response>
      <AI>
        <Assistant id="${ASSISTANT_ID}" />
      </AI>
    </Response>
  `;
  res.type('application/xml').send(teXML.trim());
});



// Dynamic Variables Webhook endpoint:
// Responds with personalized data for the AI assistant based on the called phone number.
// Dynamically sets greeting text, voice, and language variables depending on customer's preferred language.
// Make sure your assistant references these variables for dynamic, localized conversations.
app.post('/dynamic-variables', (req, res) => {
  const to = req.body?.data?.payload?.to;

  const lang = (customer.preferred_language || 'en').toLowerCase();

  // Set voice dynamically based on language preference
  const voice = (lang === 'es' || lang === 'spanish')
    ? 'Telnyx.NaturalHD.Astra'  // Use your Spanish voice here
    : 'Telnyx.NaturalHD.Astra'; // English voice (you can change if needed)

  // language variable for your assistant logic (if needed)
  const language = (lang === 'es' || lang === 'spanish') ? 'spanish' : 'english';

  const greeting_text = (lang === 'es' || lang === 'spanish')
    ? `Hola ${customer.first_name}, te habla Claire de ${customer.dealer_name}. Te llamo para recordarte de tu próximo pago de $${customer.amount_due} por tu ${customer.car_year} ${customer.car_make} ${customer.car_model}. Si este es un buen momento, puedo ayudarte con el pago, o podemos fijar una hora que funcione mejor para ti. ¿Te parece bien?`
    : `Hi ${customer.first_name}, this is Claire from ${customer.dealer_name}. I'm reaching out to remind you of your upcoming payment of $${customer.amount_due} for your ${customer.car_year} ${customer.car_make} ${customer.car_model}. If now's a good time, I'd be happy to help you with your payment—or we can set up a time that works better for you. How does that sound?`;

  if (to !== customer.phone_number) {
    return res.status(404).json({ error: "Customer not found" });
  }

  console.log(`✅ Sending dynamic variables for ${to}`);

  return res.json({
    dynamic_variables: {
      first_name: customer.first_name,
      car_year: customer.car_year,
      car_make: customer.car_make,
      car_model: customer.car_model,
      amount_due: customer.amount_due,
      dealer_name: customer.dealer_name,
      dealer_website: customer.dealer_website,
      regular_amount_due: customer.regular_amount_due,
      pickups_due: customer.pickups_due,
      side_notes_due: customer.side_notes_due,
      recurring_fees_due: customer.recurring_fees_due,
      late_fees_due: customer.late_fees_due,
      other_receivables_due: customer.other_receivables_due,
      live_agent_phone_number: customer.live_agent_phone_number,
      ivr_phone_number: customer.ivr_phone_number,
      due_date: customer.due_date,
      rfc_name: customer.rfc_name,
      co_buyer_name: customer.co_buyer_name,
      preferred_language: customer.preferred_language,
      greeting_text,
      voice,
      language,
    }
  });
});


// Status Callback endpoint:
// Receives call status updates (e.g. call started, answered, completed) from Telnyx.
// Useful for logging and troubleshooting call flow.
app.post('/status-callback', (req, res) => {
  console.log('📞 Call status update:', req.body?.data?.event_type);
  res.sendStatus(200);
});


// Log Interaction endpoint:
// Receives conversational insights from Claire AI assistant after each interaction.
// Parses intent, payment date, summary, and follow-up info for logging and analytics.
// Extend as needed to persist data to a database or CRM.
app.post('/log-interaction', (req, res) => {
  console.log('🧠 Claire Insight Log raw payload:', JSON.stringify(req.body, null, 2));

  const payload = req.body.payload || {};
  const conversation_id = payload.conversation_id;

  let summary = '';
  let intent_to_pay = false;
  let intent_to_pay_date = null;
  let follow_up = null;

  if (Array.isArray(payload.results)) {
    // Extract the JSON from the first result item
    try {
      const firstResult = JSON.parse(payload.results[0].result);
      intent_to_pay = firstResult.intent_to_pay;
      intent_to_pay_date = firstResult.intent_to_pay_date;
      follow_up = firstResult.follow_up;
    } catch (err) {
      console.error('❌ Failed to parse first result JSON:', err);
    }

    // Extract summary text from second result item (if exists)
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


module.exports = customer;