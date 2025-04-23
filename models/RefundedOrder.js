const mongoose = require('mongoose');

// Function to generate a unique suffix
const generateUniqueSuffix = () => {
    return Math.floor(100000 + Math.random() * 900000);
  };

  
const RefundedOrderSchema = new mongoose.Schema({
    order_number:{
        type:Number,
        required:true,
    },
    order_date:{
      type:Date
    },
    customer_name:{
        type: String,
    },
    tax_amount:{
        type: String
    },
    total_price:{
        type: Number,
        required: true,
    },
    cancellation_date:{
        type: Date
    },
    status:{
        type: String
    },
    cn_prefix: {
        type: String,
        default: "CN", // Default prefix, but user can update it
      },
      cn_suffix: {
        type: Number,
        unique: true,
        default: generateUniqueSuffix,
      },
      cn_number: {
        type: String,
      },
}, {timestamps:false,
    toJSON: { virtuals: true }, // Include virtuals in JSON output
    toObject: { virtuals: true } 
});

// Middleware to set cn_number before saving
RefundedOrderSchema.pre('save', function (next) {
    this.cn_number = `${this.cn_prefix}${this.cn_suffix}`;
    next();
  });

  
module.exports = mongoose.model('RefundedOrder', RefundedOrderSchema)
