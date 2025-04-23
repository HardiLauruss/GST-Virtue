const mongoose = require('mongoose');

const hsnSavedReportSchema = new mongoose.Schema({
  type: String, // HSN
  monthYear: String, // e.g., February-2025
  generatedDate: String, // e.g., 17/04/2025
  rawMonth: String, // february
  year: String, // 2025
});

module.exports = mongoose.model('HSNSavedReport', hsnSavedReportSchema);    