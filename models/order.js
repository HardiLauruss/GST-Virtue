const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: false,
        unique: false,
        default: null
    },
    order_number: { type: Number, required: true, unique: true },
    invoice_number: { type: String },
    date: { type: Date, required: true },
    customer_name: { type: String },
    total_price: { type: Number, required: true },
    order_status_url: { type: String, default: '' },
    fulfillment_status: { type: String, default: 'Unfulfilled' },
    email: { type: String, required: true },
    user_id: { type: Number, default: null },
    store_name: { type: String, required: true },
    note: { type: String },
    current_subtotal_price: { type: String },
    processed_at: { type: String },
    payment_status: {
        type: String,
        required: false,
        default: 'pending'
    },
    payment_gateway_names: { type: [String], default: [] },
    line_items: {
        type: Array,
        default: []
    },
    billing_address: {
        first_name: { type: String },
        address1: { type: String },
        phone: { type: String, default: null },
        city: { type: String },
        zip: { type: String },
        province: { type: String },
        country: { type: String },
        last_name: { type: String },
        address2: { type: String, default: null },
        company: { type: String, default: null },
        latitude: { type: Number, default: null },
        longitude: { type: Number, default: null },
        name: { type: String },
        country_code: { type: String },
        province_code: { type: String }
    },
    shipping_address: {
        first_name: { type: String },
        address1: { type: String },
        phone: { type: String, default: null },
        city: { type: String },
        zip: { type: String },
        province: { type: String },
        country: { type: String },
        last_name: { type: String },
        address2: { type: String, default: null },
        company: { type: String, default: null },
        latitude: { type: Number, default: null },
        longitude: { type: Number, default: null },
        name: { type: String },
        country_code: { type: String },
        province_code: { type: String }
    },
    customer: {
        type: mongoose.Schema.Types.Mixed,  // Customer object with any structure
        default: {}
    },
    total_shipping_price_set: {
        type: mongoose.Schema.Types.Mixed,  // Customer object with any structure
        default: {}
    },
    total_discounts: { type: String }
}, { timestamps: true });


const Order = mongoose.model('Order', OrderSchema);
module.exports = Order;