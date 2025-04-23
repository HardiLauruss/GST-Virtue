const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const Setting = require('../models/setting');
const sharp = require('sharp');


router.post('/', upload.fields([{ name: 'logo_image', maxCount: 1 }, { name: 'signature_image', maxCount: 1 }]), async (req, res) => {
    try {
        const {
            store_name, company_legal_name, brand_name, store_phone, store_email,
            store_address, contact_person, gst_number, iec_code, cin_number, pan_number,
            fssai_lic_number, store_city, store_pincode, store_state, store_state_code,
            store_country, store_country_code
        } = req.body;

        const updateData = {
            store_name,
            company_legal_name,
            brand_name,
            store_phone,
            store_email,
            store_address,
            contact_person,
            gst_number,
            iec_code,
            cin_number,
            pan_number,
            fssai_lic_number,
            store_city,
            store_pincode,
            store_state,
            store_state_code,
            store_country,
            store_country_code
        };

        // Logo image validation and update
        if (req.files['logo_image']) {
            const logoImagePath = req.files['logo_image'][0].path;
            const metadata = await sharp(logoImagePath).metadata();
            if (metadata.width > 250 || metadata.height > 125) {
                return res.status(400).json({ message: 'Logo image dimensions must be no more than 250px (width) and 125px (height).' });
            }
            updateData.logo_image = logoImagePath;
        }

        // Signature image validation and update
        if (req.files['signature_image']) {
            const signatureImagePath = req.files['signature_image'][0].path;
            const metadata = await sharp(signatureImagePath).metadata();
            if (metadata.width > 150 || metadata.height > 80) {
                return res.status(400).json({ message: 'Signature image dimensions must be no more than 150px (width) and 80px (height).' });
            }
            updateData.signature_image = signatureImagePath;
        }

        // Create or update settings
        const settings = await Setting.findOneAndUpdate(
            { store_name },
            updateData,
            { upsert: true, new: true }
        );

        res.status(200).json({ message: 'Settings updated successfully', settings });
    } catch (error) {
        res.status(500).json({ message: 'Error updating settings', error: error.message });
    }
});


router.get('/:store_name', async (req, res) => {
    try {
        const { store_name } = req.params;
        const storeName = req.headers['store-name'];
    const apiVersion = req.headers['api-version'];
    const accessToken = req.headers['access-token'];

        const shopifyResponse = await fetch(`https://${storeName}/admin/api/2025-01/shop.json`, {
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken
            }
        });

        if (!shopifyResponse.ok) {
            return res.status(shopifyResponse.status).json({ message: 'Error fetching data from Shopify' });
        }

        const shopifyData = await shopifyResponse.json();
        const shopDetails = shopifyData.shop;


        const settings = await Setting.findOne({ store_name });

        if (!settings) {
            return res.status(200).json({
                "_id": "",
                "store_name": storeName,
                "__v": 0,
                "brand_name": "",
                "cin_number": "",
                "company_legal_name": "",
                "contact_person": "",
                "createdAt": "",
                "fssai_lic_number": "",
                "gst_number": "",
                "iec_code": "",
                "logo_image": "",
                "pan_number": "",
                "signature_image": "",
                "store_address": "",
                "store_city": "",
                "store_country": "",
                "store_country_code": "",
                "store_email": "",
                "store_phone": "",
                "store_pincode": "",
                "store_state": "",
                "store_state_code": "",
                "updatedAt": ""
            });
        }

        settings.store_city = shopDetails.city;
        settings.store_country = shopDetails.country_name;
        settings.store_country_code = shopDetails.country_code;
        settings.store_pincode = shopDetails.zip;
        settings.store_state = shopDetails.province;
        settings.store_state_code = shopDetails.province_code;
        await settings.save();
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching store details', error: error.message });
    }
});

module.exports = router;