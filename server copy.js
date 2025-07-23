// server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const EventEmitter = require('events');
const app = express();
const port = process.env.PORT || 3000;

// Parse JSON
app.use(bodyParser.json());

// Call status event emitter
const callEvents = new EventEmitter();

// Shared customer list
const customers = [
  {
    phone_number: "+13109082230",
    first_name: "Alice",
    car_year: "2018",
    car_make: "Toyota",
    car_model: "Camry",
    amount_due: "450.00"
  },
  {
    phone_number: "+13109082230",
    first_name: "Bob",
    car_year: "2020",
    car_make: "Honda",
    car_model: "Civic",
    amount_due: "325.00"
  }
];

// Status callback route
app.post('/status-callback', (req, res) => {
  const event = req.body;

  if (event?.data?.event_type === 'call.hangup' || event?.data?.event_type === 'call.completed') {
    const callId = event.data.payload.sid;
    console.log(`📞 Call ended: ${callId}`);
    callEvents.emit(`callCompleted:${callId}`);
  }

  res.sendStatus(200);
});

// Dynamic variables route
app.post('/dynamic-variables', (req, res) => {
  const to = req.body?.data?.payload?.to;

  if (!to) {
    console.log('❌ No "to" number found in webhook payload', req.body);
    return res.status(400).json({ error: 'Missing "to" phone number in webhook payload' });
  }

  const customer = customers.find(c => c.phone_number === to);
  if (!customer) {
    return res.status(404).json({ error: "Customer not found" });
  }

  const variables = {
    first_name: customer.first_name,
    car_year: customer.car_year,
    car_make: customer.car_make,
    car_model: customer.car_model,
    amount_due: customer.amount_due,
    dealer_name: "CarPay",
    dealer_website: "https://pay.carpay.com"
  };

  console.log(`📦 Sending dynamic variables for ${to}`);
  res.json({ dynamic_variables: variables }); // <-- FIXED: wrap in dynamic_variables
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Webhook server listening on port ${port}`);
});

module.exports = { callEvents, customers };
