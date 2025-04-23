const express = require('express');
const PrefixRunningNumber = require('../models/prefix_running_numbers');  // Make sure the correct path to the model is used
const router = express.Router();
const mongoose = require('mongoose');
const axios = require('axios');


router.post("/", async (req, res) => {
    try {
        const storeName = req.headers['store-name'];
        const apiVersion = req.headers['api-version'];
        const accessToken = req.headers['access-token'];
        const { invoice_prefix, invoice_number, credit_note_prefix, credit_note_number, estimate_prefix, estimate_number, offline_prefix, offline_number, bill_prefix, bill_number } = req.body;

        if (!storeName || !apiVersion || !accessToken) {
            return res.status(400).json({ error: "Missing required headers" });
        }

        const prefixRunning = {
            store_name: storeName, // Ensure this is unique
            invoice_prefix,
            invoice_number,
            credit_note_prefix,
            credit_note_number,
            estimate_prefix,
            estimate_number,
            offline_prefix,
            offline_number,
            bill_prefix,
            bill_number
        };

        // Check if a document with the same store name already exists
        const existingPrefixRunning = await PrefixRunningNumber.findOne({ store_name: storeName });

        if (existingPrefixRunning) {
            // Update the existing document
            await PrefixRunningNumber.updateOne({ store_name: storeName }, prefixRunning);
            res.status(200).json({ message: "Prefix running numbers updated successfully", prefixRunning });
        } else {
            // Create a new document
            await PrefixRunningNumber.create(prefixRunning);
            res.status(201).json({ message: "Prefix running numbers created successfully", prefixRunning });
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

        const prefixRunning = await PrefixRunningNumber.findOne({ store_name: storeName });

        if (!prefixRunning) {
            return res.status(200).json({
                "store_name": storeName,
                invoice_prefix: "",
                invoice_number: 0,
                credit_note_prefix: "",
                credit_note_number: 0,
                estimate_prefix: "",
                estimate_number: 0,
                offline_prefix: "",
                offline_number: 0,
                bill_prefix: "",
                bill_number: 0,
            });
        }

        res.status(200).json(prefixRunning);
    } catch (error) {
        console.error("🚨 Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;