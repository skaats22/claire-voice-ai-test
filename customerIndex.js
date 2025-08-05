// customerIndex.js
const customers = require('./customers');

const customerMap = new Map();
for (const customer of customers) {
  customerMap.set(customer.id, customer);
}

module.exports = customerMap;
