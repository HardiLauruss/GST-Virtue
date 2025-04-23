const express = require('express');
const router = express.Router();
const EmailFormate = require('../models/email_formate');

router.post('/', async (req, res) => {
    try {
        const storeName = req.headers['store-name'];
        if (!storeName) {
            return res.status(400).send('Store name is required.');
        }

        const { online_order_email, offline_order_email, estimates_email } = req.body;


        // Check if a template with the given store name already exists
        let emailFormate = await EmailFormate.findOne({ storeName });

        if (emailFormate) {
            // Update the existing template's signature URL
            emailFormate.online_order_email = online_order_email;
            emailFormate.offline_order_email = offline_order_email;
            emailFormate.estimates_email = estimates_email;
        } else {
            // Create a new template with the store name and signature URL
            emailFormate = new EmailFormate({
                storeName,
                online_order_email,
                offline_order_email,
                estimates_email
            });
        }

        // Save the template to the database
        await emailFormate.save();

        res.status(200).json({
            message: 'Update Successfully',
            online_order_email: emailFormate.online_order_email,
            offline_order_email: emailFormate.offline_order_email,
            estimates_email: emailFormate.estimates_email
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
        const emailFormate = await EmailFormate.findOne({ storeName });

        if (!emailFormate) {
            return res.status(200).send({
                emailFormate: {
                    online_order_email: {
                        subject: "Invoice Copy of order Order_Name",
                        body: "<p>Hi <strong>Customer_Name</strong>,</p><p><br></p><h2><strong>Thank you for your purchase!</strong></h2><p>we're getting your order ready to be shipped.We will notify you when it has been sent.</p><p><br></p><p><br></p><p>Kindly Download your invoice of your Order <strong>Order_Name.</strong></p>"
                    },
                    offline_order_email: {
                        subject: "Invoice Copy of Invoice Number Invoice_Number",
                        body: "<p>Hi <strong>Customer_Name,</strong></p><p><br></p><h2><strong>Thank you for your purchase!</strong></h2><p>we're getting your order ready to be shipped.We will notify you when it has been sent.</p><p><br></p><p><br></p><p>Kindly Download your invoice of your invoice<strong> Invoice_Number.</strong></p>"
                    },
                    estimates_email: {
                        subject: "Copy of Estimate Number Estimate_Number",
                        body: "<p>Hi <strong>Customer_Name,</strong></p><p><br></p><h2><strong>Greetings from Store_Name!</strong></h2><p>Thank you for contacting us.</p><p><br></p><p>Here is your estimate. Kindly download from the link below</p>"
                    },
                    _id: "67b84172972378b0a9f81895",
                    storeName: "gst-virtue-paras.myshopify.com",
                    __v: 0
                }
            });
        }

        res.status(200).json({
            emailFormate
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;