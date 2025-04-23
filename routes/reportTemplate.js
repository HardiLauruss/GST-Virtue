// Report center page
// credit note report template 

const express = require("express");
const router = express.Router();
const ReportTemplate = require('../models/creditReport');


router.post("/save", async (req, res) => {
    const { title, fields } = req.body;

    // Validate the request
    if (!title || !Array.isArray(fields) || fields.length === 0) {
        return res.status(400).json({ message: 'Title and fields are required.' });
    }
    try {
        const newTemplate = new ReportTemplate({ title, fields });
        await newTemplate.save();
        res.status(200).json({ message: 'Template saved successfully!' });
    } catch (error) {
        console.error("Error saving template:", error);
        res.status(500).json({ message: 'Error saving template' });
    }
});

// Fetch All Templates
router.get("/all", async (req, res) => {
    try {
        const templates = await ReportTemplate.find();
        res.status(200).json(templates);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

router.delete("/delete/:id", async (req, res) => {
    try {
        const templateId = req.params.id;

        // Delete template using the provided ID
        const result = await ReportTemplate.findByIdAndDelete(templateId);

        if (result) {
            return res.status(200).json({ message: "Template deleted successfully" });
        } else {
            return res.status(404).json({ message: "Template not found" });
        }
    } catch (error) {
        console.error("Error deleting template:", error);
        return res.status(500).json({ message: "Failed to delete template" });
    }
});


module.exports = router;
