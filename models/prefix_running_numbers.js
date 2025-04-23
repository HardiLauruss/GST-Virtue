const mongoose = require('mongoose');

const prefixRunningSchema = new mongoose.Schema({
    store_name: { type: String, required: true },
    invoice_prefix: { type: String, required: true },
    invoice_number: { type: Number, required: true },
    credit_note_prefix: { type: String, required: true },
    credit_note_number: { type: Number, required: true },
    estimate_prefix: { type: String, required: true },
    estimate_number: { type: Number, required: true },
    offline_prefix: { type: String, required: true },
    offline_number: { type: Number, required: true },
    bill_prefix: { type: String, required: true },
    bill_number: { type: Number, required: true },
});

const PrefixRunning = mongoose.model('PrefixRunning', prefixRunningSchema);

module.exports = PrefixRunning;