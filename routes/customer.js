const express = require('express');
const Customer = require('../models/customer');  // Make sure the correct path to the model is used
const router = express.Router();
const mongoose = require('mongoose');
const axios = require('axios');


// router.post('/', async (req, res) => {
//     try {
//         const {customers} = req.body;
//         if (!Array.isArray(customers) || customers.length === 0) {
//             return res.status(400).json({ message: 'Products must be an array with at least one product.' });
//         }

//         const processedCustomers = [];
//         for (const customer of customers) {
//             const { id, title, firstName, lastName, email, phone, companyName,gstNumber,gst,hsnCodeCode,miniAmount,miniGst,cess,address } = customer;
//             if (!id || isNaN(id)) {
//                 return res.status(400).json({ message: `Invalid product ID format for product: ${title}. ID must be numeric.` });
//             }
//             const updatedCustomer = await Customer.findOneAndUpdate(
//                 { id }, // Find by product ID
//                 { title, firstName, lastName, email, phone, companyName,gstNumber,gst,hsnCodeCode,miniAmount,miniGst,cess,address  }, // Fields to update
//                 { new: true, upsert: true, setDefaultsOnInsert: true } // Upsert options
//             );
//             processedCustomers.push(updatedCustomer);
//         }
//         res.status(200).json({
//             message: 'Customer processed successfully',
//             products: processedCustomers,
//         });
//     } catch (error) {
//         console.error('Error processing products:', error.message);
//         res.status(500).json({ message: 'Failed to process customer', error: error.message });
//     }
// });

router.get('/', async (req, res) => {
    try {
        const storeName = req.headers['store-name'];
        const apiVersion = req.headers['api-version'];
        const accessToken = req.headers['access-token'];
        const { search } = req.query;

        if (!storeName || !apiVersion || !accessToken) {
            return res.status(400).json({ error: 'Missing required headers: store-name, api-version, access-token' });
        }

        const url = `https://${storeName}/admin/api/${apiVersion}/customers.json`;
        const headers = {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken,
        };

        const shopifyResponse = await axios.get(url, { headers });
        const shopifyCustomers = shopifyResponse.data.customers;

        if (!shopifyCustomers || shopifyCustomers.length === 0) {
            const allCustomers = await Customer.find({ store_name: storeName });
            return res.status(200).json(allCustomers);
        }

        // **Step 1: Fetch existing customers from MongoDB**
        const existingCustomers = await Customer.find({
            shopifyId: { $in: shopifyCustomers.map(c => c.id) },
            store_name: storeName
        });

        const customerMap = new Map(existingCustomers.map(c => [c.shopifyId, c]));

        // **Step 2: Process customers**
        const operations = shopifyCustomers.map(async (shopifyCustomer) => {
            const existingCustomer = customerMap.get(shopifyCustomer.id);

            const customerData = {
                shopifyId: shopifyCustomer.id, // ✅ Correctly map id → shopifyId
                store_name: storeName,
                email: shopifyCustomer.email || null, // ✅ Ensure email exists
                first_name: shopifyCustomer.first_name,
                last_name: shopifyCustomer.last_name,
                phone: shopifyCustomer.phone,
                addresses: shopifyCustomer.addresses || [],
                created_at: shopifyCustomer.created_at,
                updated_at: shopifyCustomer.updated_at,
                orders_count: shopifyCustomer.orders_count,
                state: shopifyCustomer.state,
                total_spent: shopifyCustomer.total_spent,
                last_order_id: shopifyCustomer.last_order_id,
                note: shopifyCustomer.note,
                verified_email: shopifyCustomer.verified_email,
                multipass_identifier: shopifyCustomer.multipass_identifier,
                tax_exempt: shopifyCustomer.tax_exempt,
                tags: shopifyCustomer.tags,
                last_order_name: shopifyCustomer.last_order_name,
                currency: shopifyCustomer.currency,
                tax_exemptions: shopifyCustomer.tax_exemptions || [],
                email_marketing_consent: shopifyCustomer.email_marketing_consent || {},
                sms_marketing_consent: shopifyCustomer.sms_marketing_consent || {},
                admin_graphql_api_id: shopifyCustomer.admin_graphql_api_id,
                default_address: shopifyCustomer.default_address || {},
                shipping_address: shopifyCustomer.default_address || {}
            };

            // Check if shipping address exists in MongoDB
            if (existingCustomer && existingCustomer.shipping_address) {
                // Shipping address already exists, don't update it
                customerData.shipping_address = existingCustomer.shipping_address;
            } else {
                // Add shipping address for the first time
                customerData.shipping_address = customerData.shipping_address || {};
            }

            if (!existingCustomer) {
                return Customer.create(customerData);
            } else {
                return Customer.findOneAndUpdate(
                    { shopifyId: shopifyCustomer.id, store_name: storeName, },
                    { $set: customerData },
                    { upsert: true, new: true }
                );
            }
        });

        await Promise.all(operations);

        let query = {store_name: storeName};
        if (search) {
            query = {
                store_name: storeName,
                $or: [
                    { first_name: { $regex: new RegExp(search, 'i') } },
                    { last_name: { $regex: new RegExp(search, 'i') } }
                ]
            };
        }
        const allCustomers = await Customer.find(query);
        res.status(200).json(allCustomers);

    } catch (error) {
        console.error('🚨 API Error:', error.message);
        res.status(400).json({ error: error.message });
    }
});

router.put("/update-shipping-address", async (req, res) => {
    try {
        const { customer_id, shipping_address } = req.body;

        if (!customer_id || !shipping_address) {
            return res.status(400).json({ error: "Customer ID and shipping address are required" });
        }

        console.log("Received request to update shipping address:", customer_id);

        // Find the customer first
        const customer = await Customer.findOne({ shopifyId: customer_id });

        if (!customer) {
            return res.status(404).json({ error: "Customer not found" });
        }

        // Log the current shipping address
        console.log("Current Shipping Address:", customer.shipping_address);

        // Update the customer's shipping address in MongoDB using the $set operator
        const updatedCustomer = await Customer.findOneAndUpdate(
            { shopifyId: customer_id },
            { $set: { "shipping_address": shipping_address } }, // Directly update the shipping_address object
            { new: true } // Return updated customer
        );

        // Log the updated customer for debugging purposes
        console.log("Updated Customer:", updatedCustomer);

        res.status(200).json({
            message: "Shipping address updated successfully",
            updatedCustomer
        });
    } catch (error) {
        console.error("🚨 MongoDB Update Error:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/", async (req, res) => {
    try {
        const storeName = req.headers['store-name'];
        const apiVersion = req.headers['api-version'];
        const accessToken = req.headers['access-token'];
        const { email, first_name, last_name, phone, addresses, company_name, gst_number } = req.body;

        if (!storeName || !apiVersion || !accessToken) {
            return res.status(400).json({ error: "Missing required headers" });
        }
        if (!email || !first_name) {
            return res.status(400).json({ error: "First Name and Email are required" });
        }

        const shopifyUrl = `https://${storeName}/admin/api/${apiVersion}/customers.json`;
        const shopifyPayload = { customer: { email, first_name, last_name, phone, addresses } };

        const shopifyResponse = await axios.post(shopifyUrl, shopifyPayload, {
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": accessToken,
            },
        });

        const newCustomer = shopifyResponse.data.customer;
        console.log("Shopify Response:", newCustomer);
        // Check if shopifyId is present, else return an error or default value
        if (!newCustomer.id) {
            return res.status(400).json({ error: "Shopify ID is missing from the response" });
        }

        // Add custom fields
        newCustomer.company_name = company_name || "";
        newCustomer.gst_number = gst_number || "";
        newCustomer.shipping_address = newCustomer.default_address || "";

        // Save to MongoDB
        await Customer.create({
            shopifyId: newCustomer.id,  // Ensure this is unique
            store_name: storeName,
            first_name: newCustomer.first_name,
            last_name: newCustomer.last_name,
            email: newCustomer.email,
            phone: newCustomer.phone,
            addresses: newCustomer.addresses || [],
            default_address: newCustomer.default_address,
            shipping_address: newCustomer.default_address,
            created_at: newCustomer.created_at,
            company_name: newCustomer.company_name,  // Save custom field
            gst_number: newCustomer.gst_number      // Save custom field
        });

        // Return response with the customer data including custom fields
        res.status(201).json({
            newCustomer
        });
    } catch (error) {
        console.error("🚨 Shopify API Error:", error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
    }
});

router.post("/bulk", async (req, res) => {
    try {
        const storeName = req.headers['store-name'];
        const apiVersion = req.headers['api-version'];
        const accessToken = req.headers['access-token'];
        const customers = req.body.customers;

        if (!storeName || !apiVersion || !accessToken) {
            return res.status(400).json({ error: "Missing required headers" });
        }
        if (!Array.isArray(customers) || customers.length === 0) {
            return res.status(400).json({ error: "Customers array is required" });
        }

        const results = [];
        const errors = [];

        for (const customerData of customers) {
            const { email, first_name, last_name, phone, addresses, company_name, gst_number } = customerData;

            if (!email || !first_name) {
                errors.push({ customerData, error: "First Name and Email are required" });
                continue;
            }

            const shopifyUrl = `https://${storeName}/admin/api/${apiVersion}/customers.json`;
            const shopifyPayload = { customer: { email, first_name, last_name, phone, addresses } };

            try {
                const shopifyResponse = await axios.post(shopifyUrl, shopifyPayload, {
                    headers: {
                        "Content-Type": "application/json",
                        "X-Shopify-Access-Token": accessToken,
                    },
                });

                const newCustomer = shopifyResponse.data.customer;
                if (!newCustomer.id) {
                    errors.push({ customerData, error: "Shopify ID is missing from the response" });
                    continue;
                }

                newCustomer.company_name = company_name || "";
                newCustomer.gst_number = gst_number || "";
                newCustomer.shipping_address = newCustomer.default_address || "";

                await Customer.create({
                    shopifyId: newCustomer.id,
                    store_name: storeName,
                    first_name: newCustomer.first_name,
                    last_name: newCustomer.last_name,
                    email: newCustomer.email,
                    phone: newCustomer.phone,
                    addresses: newCustomer.addresses || [],
                    default_address: newCustomer.default_address,
                    shipping_address: newCustomer.default_address,
                    created_at: newCustomer.created_at,
                    company_name: newCustomer.company_name,
                    gst_number: newCustomer.gst_number
                });

                results.push(newCustomer);
            } catch (error) {
                errors.push({ customerData, error: error.response?.data || error.message });
            }
        }

        res.status(207).json({ results, errors });
    } catch (error) {
        console.error("🚨 Bulk Add Customers API Error:", error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
    }
});

router.put("/:customerId", async (req, res) => {
    try {
        const storeName = req.headers['store-name'];
        const apiVersion = req.headers['api-version'];
        const accessToken = req.headers['access-token'];
        const { email, first_name, last_name, phone, addresses, company_name, gst_number } = req.body;
        const { customerId } = req.params;

        if (!storeName || !apiVersion || !accessToken) {
            return res.status(400).json({ error: "Missing required headers" });
        }
        if (!customerId) {
            return res.status(400).json({ error: "Customer ID is required" });
        }

        const shopifyUrl = `https://${storeName}/admin/api/${apiVersion}/customers/${customerId}.json`;
        const shopifyPayload = { 
            customer: { 
                id: customerId, 
                email, 
                first_name, 
                last_name, 
                phone, 
                addresses 
            } 
        };

        const shopifyResponse = await axios.put(shopifyUrl, shopifyPayload, {
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": accessToken,
            },
        });

        const updatedCustomer = shopifyResponse.data.customer;
        console.log("Shopify Response:", updatedCustomer);

        if (!updatedCustomer.id) {
            return res.status(400).json({ error: "Shopify ID is missing from the response" });
        }

        // Update custom fields
        updatedCustomer.company_name = company_name || "";
        updatedCustomer.gst_number = gst_number || "";

        // Update MongoDB
        const updatedMongoCustomer = await Customer.findOneAndUpdate(
            { shopifyId: updatedCustomer.id },
            {
                first_name: updatedCustomer.first_name,
                last_name: updatedCustomer.last_name,
                email: updatedCustomer.email,
                phone: updatedCustomer.phone,
                addresses: updatedCustomer.addresses || [],
                default_address: updatedCustomer.default_address,
                company_name: updatedCustomer.company_name,
                gst_number: updatedCustomer.gst_number
            },
            { new: true, upsert: false }
        );

        const customer = {
            shopifyId: updatedCustomer.id, // Rename id to shopify_id
            first_name: updatedCustomer.first_name,
            last_name: updatedCustomer.last_name,
            email: updatedCustomer.email,
            phone: updatedCustomer.phone,
            addresses: updatedCustomer.addresses || [],
            default_address: updatedCustomer.default_address,
            company_name: updatedCustomer.company_name,
            gst_number: updatedCustomer.gst_numberm,
            shipping_address: updatedMongoCustomer.shipping_address
        };
        // Return updated customer
        res.status(200).json({
            customer
        });
    } catch (error) {
        console.error("🚨 Shopify API Error:", error.response?.data || error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
    }
});



module.exports = router;