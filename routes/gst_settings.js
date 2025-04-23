const express = require('express');
const GSTSetting = require('../models/gst_settings');  // Make sure the correct path to the model is used
const router = express.Router();
const mongoose = require('mongoose');
const axios = require('axios');

router.post("/", async (req, res) => {
    try {
        const storeName = req.headers['store-name'];
        const apiVersion = req.headers['api-version'];
        const accessToken = req.headers['access-token'];
        const { shipping_gst, sac_code, gst_include_product_price, gst_include_shipping_price, gst_on_shipping, igst_on_export_order, apply_gst_when_product_with_full_discount, selling_services } = req.body;

        if (!storeName || !apiVersion || !accessToken) {
            return res.status(400).json({ error: "Missing required headers" });
        }

        const gstSetting = {
            store_name: storeName, // Ensure this is unique
            shipping_gst,
            sac_code,
            gst_include_product_price,
            gst_include_shipping_price,
            gst_on_shipping,
            igst_on_export_order,
            apply_gst_when_product_with_full_discount,
            selling_services,
        };

        // Check if a document with the same store name already exists
        const existingGSTSetting = await GSTSetting.findOne({ store_name: storeName });

        if (existingGSTSetting) {
            // Update the existing document
            await GSTSetting.updateOne({ store_name: storeName }, gstSetting);
            res.status(200).json({ message: "Prefix running numbers updated successfully", gstSetting });
        } else {
            // Create a new document
            await GSTSetting.create(gstSetting);
            res.status(201).json({ message: "Prefix running numbers created successfully", gstSetting });
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

        const gstSetting = await GSTSetting.findOne({ store_name: storeName });

        if (!gstSetting) {
            return res.status(200).json({
                store_name: storeName, // Ensure this is unique
                shipping_gst: 0,
                sac_code: 0,
                gst_include_product_price: false,
                gst_include_shipping_price: false,
                gst_on_shipping: false,
                igst_on_export_order: false,
                apply_gst_when_product_with_full_discount: false,
                selling_services: false,
            });
        }

        res.status(200).json(gstSetting);
    } catch (error) {
        console.error("🚨 Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;