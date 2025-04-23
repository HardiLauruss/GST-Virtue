const mongoose = require('mongoose');

const emailSettingSchema = new mongoose.Schema({
    store_name: { type: String, required: true },
    automaticallySendInvoicesWhenTheOrdersAreCreatedSelectedOption: { type: String },
    automaticEmailNotificationsForCustomers: { type: Boolean, default: false },
    email: { type: String },
});

const EmailSetting = mongoose.model('EmailSetting', emailSettingSchema);

module.exports = EmailSetting;