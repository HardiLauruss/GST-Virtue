const express = require('express');
const EmailSetting = require('../models/email_settings');  // Make sure the correct path to the model is used
const router = express.Router();
const mongoose = require('mongoose');
const axios = require('axios');

router.post("/", async (req, res) => {
    try {
        const storeName = req.headers['store-name'];
        const apiVersion = req.headers['api-version'];
        const accessToken = req.headers['access-token'];
        const { automaticallySendInvoicesWhenTheOrdersAreCreatedSelectedOption, automaticEmailNotificationsForCustomers, email } = req.body;

        if (!storeName || !apiVersion || !accessToken) {
            return res.status(400).json({ error: "Missing required headers" });
        }

        const emailSetting = {
            store_name: storeName, // Ensure this is unique
            automaticallySendInvoicesWhenTheOrdersAreCreatedSelectedOption,
            automaticEmailNotificationsForCustomers,
            email
        };

        // Check if a document with the same store name already exists
        const existingEmailSetting = await EmailSetting.findOne({ store_name: storeName });

        if (existingEmailSetting) {
            // Update the existing document
            await EmailSetting.updateOne({ store_name: storeName }, emailSetting);
            res.status(200).json({ message: "Prefix running numbers updated successfully", emailSetting });
        } else {
            // Create a new document
            await EmailSetting.create(emailSetting);
            res.status(201).json({ message: "Prefix running numbers created successfully", emailSetting });
        }
    } catch (error) {
        console.error("🚨 Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

router.get("/:storeName", async (req, res) => {
    try {
        const storeName = req.params.storeName;

        if (!storeName) {
            return res.status(400).json({ error: "Missing store name parameter" });
        }

        const emailSetting = await EmailSetting.findOne({ store_name: storeName });

        if (!emailSetting) {
            return res.status(200).json({
                store_name: storeName, // Ensure this is unique
                automaticallySendInvoicesWhenTheOrdersAreCreatedSelectedOption: "automatically-send-invoices-when-the-orders-are-created",
                automaticEmailNotificationsForCustomers: false,
                email: ""
            });
        }

        res.status(200).json(emailSetting);
    } catch (error) {
        console.error("🚨 Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;