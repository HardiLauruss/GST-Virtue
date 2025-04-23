const mongoose = require('mongoose');

const ReportTemplateSchema = new mongoose.Schema({
    title:{
        type: String,
        required: true,
        unique: true,
    },
    fields : {
        type: [String],
        required: true,
    }
});

module.exports = mongoose.model("ReportTemplate", ReportTemplateSchema);

