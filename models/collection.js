const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const CollectionSchema = new Schema({
    store_name: String,
    id: String,
    handle: String,
    title: String,
    updated_at: String,
    body_html: String,
    published_at: String,
    sort_order: String,
    template_suffix: String,
    published_scope: String,
    admin_graphql_api_id: String,
    mini_amount: Number,
    mini_gst: Number,
    gst: Number,
    hsn_code: String,
    cess: Number,
});

module.exports = Collection = mongoose.model('collections', CollectionSchema);