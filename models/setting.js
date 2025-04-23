const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
    store_name: { type: String, required: true, unique: true }, // Unique store name
    company_legal_name: { type: String, required: true },
    brand_name: { type: String, required: true },
    store_phone: { type: String, required: true },
    store_email: { type: String, required: true },
    store_address: { type: String, required: true },
    contact_person: { type: String, required: true },
    gst_number: { type: String, required: false },
    iec_code: { type: String, required: false },
    cin_number: { type: String, required: false },
    pan_number: { type: String, required: false },
    fssai_lic_number: { type: String, required: false },
    logo_image: { type: String, required: false },
    signature_image: { type: String, required: false },
    store_city: { type: String, required: false },
    store_pincode: { type: String, required: false },
    store_state: { type: String, required: false },
    store_state_code: { type: String, required: false },
    store_country: { type: String, required: false },
    store_country_code: { type: String, required: false }
}, { timestamps: true });

module.exports = mongoose.model('Setting', SettingSchema);