const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  billNumber: { type: String, required: true },
  payeeVendor: { type: String, required: true },
  billDate: { type: Date, required: true },
  paymentDate:{type: Date},
  dueDate: { type: Date },
  totalTax: { type: Number, default: 0 },
  total: { type: Number, required: true },
  totalShippingCharge: { type: Number, default: 0 },
  paymentTerms: { type: String, default: "Net 30" },
  productId: { type: String, required: true },
  selectedProduct: {
    id: { type: String }, // Product ID
    title: { type: String }, // Product Title
    hsn: { type: String }, // HSN Code
    gst: { type: Number }, // GST Percentage
    cess: { type: Number }, // Cess Percentage
  },
  rate: {
    type:Number,
  },
  cgstAmount: Number,   
  sgstAmount: Number,  
});

module.exports = mongoose.model('Bill', billSchema);