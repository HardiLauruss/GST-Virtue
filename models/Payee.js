const mongoose = require('mongoose');

const payeeSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  company: { type: String, required: true },
  phone: { type: String, required: true },
  mobile: { type: String, required: true },
  displayName: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  gstIn: { type: String, required: true },
});

module.exports = mongoose.model('Payee', payeeSchema);