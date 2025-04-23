const mongoose = require("mongoose");

const HSNSummarySchema = new mongoose.Schema({
    type: { type: String, required: true },
    monthYear: { type: String, required: true },
    generatedDate: { type: String, required: true },
    rawMonth: { type: String, required: true },
    year: { type: Number, required: true },
});

module.exports = mongoose.model("HSNSummary", HSNSummarySchema);
