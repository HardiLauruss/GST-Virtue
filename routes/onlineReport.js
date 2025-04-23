//online order reprort 
//data saved to backend so that it does not vanish on server reload 

const express = require("express");
const router = express.Router();
const OnlineReportTemplate = require('../models/ReportTemplate');

router.post("/report-templates", async (req, res) => {
    const { title, fields } = req.body;
  
    if (!title || !fields || fields.length === 0) {
      return res.status(400).json({ message: "Title and fields are required" });
    }
  
    try {
      let template = await OnlineReportTemplate.findOne({ title });
  
      if (template) {
        template.fields = fields;
      } else {
        template = new OnlineReportTemplate({ title, fields });
      }
  
      await template.save();
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Error saving template", error });
    }
});

//Get code 
router.get("/report-templates", async (req, res) => {
    try {
        const templates = await OnlineReportTemplate.find();
        res.json(templates);
      } catch (error) {
        res.status(500).json({ message: "Error fetching templates", error });
      }
});

//delete by id 
router.delete("/report-templates/:id", async (req, res) => {
    try {
        const tempId = req.params.id;
        const result = await OnlineReportTemplate.findByIdAndDelete(tempId);
        res.json({ message: "Template deleted", result });
      } catch (error) {
        res.status(500).json({ message: "Error deleting template", error });
      }
});

module.exports = router;