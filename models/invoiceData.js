const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: { type: String, required: true },  
    customerName: String,
    invoiceDate: String,
    dateOfSupply: String,
    totalTax: { type: Number, required: true },    
    Status: { type: String, required: true },
    total: Number,

    hsn: { type: String },                  
    gst: { type: Number },                  
    cess: { type: Number },                  
    shippingCharge: { type: Number },
    rate: {type: Number}
  });
  
  // Create Invoice Model
  const Invoice = mongoose.model('Invoice', invoiceSchema);
  module.exports = Invoice;