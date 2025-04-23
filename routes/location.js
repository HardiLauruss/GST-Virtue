const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const Location = require('../models/location');

// GET route to fetch and update locations
router.get('/', async (req, res) => {
    try {
        const storeName = req.headers['store-name'];
        const apiVersion = req.headers['api-version'];
        const accessToken = req.headers['access-token'];

        // Call Shopify API
        const shopifyResponse = await fetch(`https://${storeName}/admin/api/${apiVersion}/locations.json`, {
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': `${accessToken}`
            }
        });

        if (!shopifyResponse.ok) {
            return res.status(shopifyResponse.status).json({ message: 'Error fetching data from Shopify' });
        }

        const shopifyData = await shopifyResponse.json();
        const shopifyLocations = shopifyData.locations;

        // Check MongoDB for existing store
        let store = await Location.findOne({ store_name: storeName });

        if (!store) {
            store = new Location({ store_name: storeName, locations: shopifyLocations });
        } else {
            // Update locations if they don't exist
            for (const shopifyLocation of shopifyLocations) {
                const existingLocation = store.locations.find(loc => loc.id === shopifyLocation.id);
                if (!existingLocation) {
                    store.locations.push(shopifyLocation);
                }
            }
        }

        await store.save();

        res.status(200).json({
            store_name: store.store_name,
            invoice_gst: store.invoice_gst || "gst-store-address",
            pos_order: store.pos_order || "pos-store-address",
            locations: store.locations
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching or updating locations', error: error.message });
    }
});


router.put('/', async (req, res) => {
    try {
        const storeName = req.headers['store-name'];
        const { invoice_gst, pos_order, locations } = req.body;

        // Find the store and update the data
        const store = await Location.findOneAndUpdate(
            { store_name: storeName },
            { invoice_gst, pos_order, locations },
            { new: true, upsert: true } // upsert option to create if not exists
        );

        res.status(200).json({
            store_name: store.store_name,
            invoice_gst: store.invoice_gst,
            pos_order: store.pos_order,
            locations: store.locations
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating store data', error: error.message });
    }
});


module.exports = router;