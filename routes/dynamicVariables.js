// routes/dynamicVariables.js
const customers = require('../customers');
const conversationToCustomerMap = new Map();
let currentIndex = 0;

module.exports = (req, res) => {
  const conversation_id = req.body?.conversation_id || null;

  let customer;
  if (conversation_id && conversationToCustomerMap.has(conversation_id)) {
    customer = conversationToCustomerMap.get(conversation_id);
  } else {
    customer = customers[currentIndex];
    currentIndex = (currentIndex + 1) % customers.length;
    if (conversation_id) conversationToCustomerMap.set(conversation_id, customer);
  }

  const greeting_text = `Hi ${customer.first_name}, this is Claire! I'm an AI Agent calling from ${customer.dealer_name}. 
  I'm reaching out to remind you of your upcoming payment of $${customer.amount_due} for your ${customer.car_year} ${customer.car_make} ${customer.car_model}. 
  If now's a good time, I'd be happy to help you with your payment—or we can set up a time that works better for you. Diga Español para cambiar al español.`;

  const response = {
    dynamic_variables: {
      ...customer,
      greeting_text,
    },
    conversation: {
      metadata: {
        telnyx_end_user_target: customer.phone_number,
      }
    }
  };

  res.json(response);
};
