const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
    storeName: {
        type: String,
        required: true,
        unique: true
    },
    logoUrl: {
        type: String
    },
    signatureUrl: {
        type: String
    },
    fontStyle: {
        type: String
    },
    textColor: {
        type: String
    },
    backgroundColor: {
        type: String
    },
    template_type: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Template = mongoose.model('Template', templateSchema);

module.exports = Template;