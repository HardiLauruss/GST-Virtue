const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
    storeName: String,
    online_order_email: {
        subject: String,
        body: String
    },
    offline_order_email: {
        subject: String,
        body: String
    },
    estimates_email: {
        subject: String,
        body: String
    }
});

const EmailFormate = mongoose.model('EmailFormate', emailSchema);

module.exports = EmailFormate;