const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
    id: Number,
    customer_id: Number,
    first_name: String,
    last_name: String,
    company: String,
    address1: String,
    address2: String,
    city: String,
    province: String,
    country: String,
    zip: String,
    phone: String,
    name: String,
    province_code: String,
    country_code: String,
    country_name: String,
    default: Boolean
});

const EmailMarketingConsentSchema = new mongoose.Schema({
    state: String,
    opt_in_level: String,
    consent_updated_at: String
});

const SmsMarketingConsentSchema = new mongoose.Schema({
    state: String,
    opt_in_level: String,
    consent_updated_at: String,
    consent_collected_from: String
});

const CustomerSchema = new mongoose.Schema({
    shopifyId: { type: Number, unique: true, required: true, index: true },
    store_name: String,
    email: String,
    created_at: String,
    updated_at: String,
    first_name: String,
    last_name: String,
    orders_count: Number,
    state: String,
    total_spent: String,
    last_order_id: Number,
    note: String,
    verified_email: Boolean,
    multipass_identifier: String,
    tax_exempt: Boolean,
    tags: String,
    last_order_name: String,
    currency: String,
    phone: String,
    addresses: [AddressSchema],
    tax_exemptions: [String],
    email_marketing_consent: EmailMarketingConsentSchema,
    sms_marketing_consent: SmsMarketingConsentSchema,
    admin_graphql_api_id: String,
    default_address: AddressSchema,
    shipping_address: AddressSchema,
    company_name: String,
    gst_number: String
});

module.exports = mongoose.model('Customer', CustomerSchema);