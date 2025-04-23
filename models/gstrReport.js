const mongoose = require("mongoose");

const gstrReportSchema = new mongoose.Schema({
    storeName: String,
    type: String, // 'b2b' or 'b2c'
    month: String,
    year: Number,
    reportData: Array, // store the result from gstMappedOrders
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("GstrReport", gstrReportSchema);