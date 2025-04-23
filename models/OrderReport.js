const mongoose = require("mongoose");
const TaxLineSchema = new mongoose.Schema({
  title: { type: String, required: true },
  price: { type: String, required: true }, // IGST
  rate: { type: Number, required: true }
});

const LineItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: String, required: true },
  quantity: { type: Number, required: true },
  hsn: { type: String }, // HSN Code
  gst: { type: String }, // GST applied to item
  cess: { type: Number, default: 0 }, // CESS if applicable
  miniAmount: { type: Number, default: 0 }, // Minimum Amount
  minGst: { type: Number, default: 0 }, // Minimum GST
  tax_lines: [TaxLineSchema] // IGST if applicable
});

const PriceSetSchema = new mongoose.Schema({
  shop_money: {
      amount: { type: String, required: true },
      currency_code: { type: String, required: true }
  }
});

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  order_number: { type: Number, required: true },
  invoice_number: { type: String, required: true },
  date: { type: Date, required: true },
  total_price: { type: Number, required: true },
  fulfillment_status: { type: String, required: true },
  email: { type: String, required: true },
  user_id: { type: Number, required: true },
  store_name: { type: String, required: true },
  processed_at: { type: Date, required: true },
  payment_status: { type: String, required: true },
  line_items: [LineItemSchema], // Nested Schema for Order Items
  total_shipping_price_set: PriceSetSchema, // Shipping Cost
  total_discounts: { type: String, default: "0.00" },
});


module.exports = mongoose.model("OrderReport", OrderSchema);
