const mongoose = require('mongoose');


const expenseSchema = new mongoose.Schema({
    payees: { 
      type: String,
       required: true
     },
     expenseCategoryValue: {
      type: String,
      required: false,
    },
    expenseDate: {type: Date},
    status: {type: String},
    paymentMethod: {type: String},
    RefNumber: String,
    totalTax: Number,
    total: Number,
    cgstAmount: Number,   
    sgstAmount: Number,   
    totalGst: Number ,
    amount : Number,
    rate: Number,
    discountPercent: Number,
  discountFlat: Number,
  gstPercentage: Number 
  }); 

module.exports = mongoose.model('Expense', expenseSchema);