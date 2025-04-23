const mongoose = require("mongoose");
const { type } = require("os");

const EstimateSchema = new mongoose.Schema({
    Estimatenum: {
       type: String, 
       default: null 
    },
    estDate: {
    type: Date,
    required: true,
  },
  Estimateprefix: {
    type: String, 
    required: true
  },
  supplyDate: {
    type: Date, 
    required:true,
  },
  ExpiryDate: {
    type: Date,
    required: true,
  },
  Customer: {
    type: String,
  },
  totalTax: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  Status: {
    type: String,
    required: true,
  },
  TransportModel: {
   type: String
  },
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

module.exports = mongoose.model("Estimate", EstimateSchema);
