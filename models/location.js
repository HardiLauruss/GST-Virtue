const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    id: { type: Number, unique: true, required: true },
    name: { type: String, required: true },
    address1: { type: String },
    address2: { type: String },
    city: { type: String },
    zip: { type: String },
    province: { type: String },
    country: { type: String },
    phone: { type: String },
    created_at: { type: Date },
    updated_at: { type: Date },
    country_code: { type: String },
    country_name: { type: String },
    province_code: { type: String },
    company_legal_name: { type: String },
    location_brand_name: { type: String },
    location_phone: { type: String },
    location_email: { type: String },
    location_address: { type: String },
    location_gst_number: { type: String },
    location_pan_number: { type: String },
    location_cin_number: { type: String },
    location_invoice_prefix: { type: String },
    location_invoice_number: { type: String },
    show_location: { type: Boolean, default: false }
});

const storeSchema = new mongoose.Schema({
    store_name: { type: String, required: true, unique: true },
    invoice_gst: { type: String, default: "" },
    pos_order: { type: String, default: "" },
    locations: [locationSchema]
});

const Location = mongoose.model('Location', storeSchema);

module.exports = Location;