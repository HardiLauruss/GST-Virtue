const mongoose = require('mongoose');

const gstSettingSchema = new mongoose.Schema({
    store_name: { type: String, required: true },
    shipping_gst: { type: Number, required: true },
    sac_code: { type: Number, required: true },
    gst_include_product_price: { type: Boolean, default: false },
    gst_include_shipping_price: { type: Boolean, default: false },
    gst_on_shipping: { type: Boolean, default: false },
    igst_on_export_order: { type: Boolean, default: false },
    apply_gst_when_product_with_full_discount: { type: Boolean, default: false },
    selling_services: { type: Boolean, default: false },
});

const GSTSetting = mongoose.model('GSTSetting', gstSettingSchema);

module.exports = GSTSetting;