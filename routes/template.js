const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const Template = require('../models/template');

// Route to upload or update logo and store its URL in the database
router.post('/upload-logo', upload.single('logo'), async (req, res) => {
    try {
        const storeName = req.headers['store-name'];
        if (!storeName) {
            return res.status(400).send('Store name is required.');
        }

        // Check if a file is uploaded
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }

        const logoUrl = `/uploads/${req.file.filename}`;

        // Check if a template with the given store name already exists
        let template = await Template.findOne({ storeName });

        if (template) {
            // Update the existing template's logo URL
            template.logoUrl = logoUrl;
        } else {
            // Create a new template with the store name and logo URL
            template = new Template({
                storeName,
                logoUrl
            });
        }

        // Save the template to the database
        await template.save();

        res.status(200).json({
            message: 'Logo uploaded/updated successfully',
            logoUrl: template.logoUrl
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/upload-signature', upload.single('signature'), async (req, res) => {
    try {
        const storeName = req.headers['store-name'];
        if (!storeName) {
            return res.status(400).send('Store name is required.');
        }

        // Check if a file is uploaded
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }

        const signatureUrl = `/uploads/${req.file.filename}`;

        // Check if a template with the given store name already exists
        let template = await Template.findOne({ storeName });

        if (template) {
            // Update the existing template's signature URL
            template.signatureUrl = signatureUrl;
        } else {
            // Create a new template with the store name and signature URL
            template = new Template({
                storeName,
                signatureUrl
            });
        }

        // Save the template to the database
        await template.save();

        res.status(200).json({
            message: 'Signature uploaded/updated successfully',
            signatureUrl: template.signatureUrl
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/change-style', async (req, res) => {
    try {
        const storeName = req.headers['store-name'];
        if (!storeName) {
            return res.status(400).send('Store name is required.');
        }

        const { fontStyle, textColor, backgroundColor } = req.body;


        // Check if a template with the given store name already exists
        let template = await Template.findOne({ storeName });

        if (template) {
            // Update the existing template's signature URL
            template.fontStyle = fontStyle;
            template.textColor = textColor;
            template.backgroundColor = backgroundColor;
        } else {
            // Create a new template with the store name and signature URL
            template = new Template({
                storeName,
                fontStyle,
                textColor,
                backgroundColor
            });
        }

        // Save the template to the database
        await template.save();

        res.status(200).json({
            message: 'Style uploaded/updated successfully',
            fontStyle: template.fontStyle,
            textColor: template.textColor,
            backgroundColor: template.backgroundColor
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/reset-style', async (req, res) => {
    try {
        const storeName = req.headers['store-name'];
        if (!storeName) {
            return res.status(400).send('Store name is required.');
        }


        // Check if a template with the given store name already exists
        let template = await Template.findOne({ storeName });

        let templateType = template?.template_type || 'Standard';
        let textColor = "#000000";
        let backgroundColor = "#EEEEEE";

        if (templateType === 'Standard') {
            textColor = "#000000";
            backgroundColor = "#EEEEEE";
        } else if (templateType === 'Classic') {
            textColor = "#000000";
            backgroundColor = "#bcd6ee";
        } else if (templateType === 'Modern') {
            textColor = "#000000";
            backgroundColor = "#eeeeee";
        } else if (templateType === 'Minimal') {
            textColor = "#000000";
            backgroundColor = "#ffffff";
        } else if (templateType === 'Informatinve') {
            textColor = "#000000";
            backgroundColor = "#ffffff";
        }

        if (template) {
            // Update the existing template's signature URL
            template.fontStyle = "Roboto";
            template.textColor = textColor;
            template.backgroundColor = backgroundColor;
        } else {
            // Create a new template with the store name and signature URL
            template = new Template({
                storeName,
                fontStyle: "Arial",
                textColor: textColor,
                backgroundColor: backgroundColor
            });
        }

        // Save the template to the database
        await template.save();

        res.status(200).json({
            message: 'Style uploaded/updated successfully',
            fontStyle: template.fontStyle,
            textColor: template.textColor,
            backgroundColor: template.backgroundColor
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/template-type', async (req, res) => {
    try {
        const storeName = req.headers['store-name'];
        const { template_type } = req.body;

        if (!storeName) {
            return res.status(400).send('Store name is required.');
        }

        if (!template_type) {
            return res.status(400).send('Template type is required.');
        }

        // Find the template by store name and update the template_type
        const template = await Template.findOneAndUpdate(
            { storeName },
            { template_type },
            { new: true, runValidators: true }
        );

        if (!template) {
            return res.status(404).send('Template not found.');
        }

        res.status(200).json({
            message: 'Template type updated successfully.',
            template
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const storeName = req.headers['store-name'];
        if (!storeName) {
            return res.status(400).send('Store name is required.');
        }

        // Find the template by store name
        const template = await Template.findOne({ storeName });

        if (!template) {
            return res.status(404).send('Template not found.');
        }

        res.status(200).json({
            logoUrl: template.logoUrl,
            signatureUrl: template.signatureUrl,
            fontStyle: template.fontStyle,
            textColor: template.textColor,
            backgroundColor: template.backgroundColor,
            template_type: template.template_type || 'standard'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;