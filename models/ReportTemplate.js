const mongoose = require("mongoose");

const reportTemplateSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true },
    fields: { type: [String], required: true },
    createdAt: { type: Date, default: Date.now }, // Helps distinguish templates
  },
  { timestamps: true }
);

const OnlineReportTemplate = mongoose.model("OnlineReportTemplate", reportTemplateSchema);

module.exports = OnlineReportTemplate;