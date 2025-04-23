const express = require("express");
const Order = require('../models/order');// Make sure the correct path to the model is used
const router = express.Router();
const mongoose = require("mongoose");
const axios = require('axios');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid'); // Import UUID generator
const Product = require('../models/product');
const Customer = require('../models/customer');

router.get('/', async (req, res) => {
    try {
        const storeName = req.headers['store-name'];
        const apiVersion = req.headers['api-version'];
        const accessToken = req.headers['access-token'];

        if (!storeName || !apiVersion || !accessToken) {
            return res.status(400).json({ error: 'Missing required headers: store-name, api-version, access-token' });
        }

        const url = `https://${storeName}/admin/api/${apiVersion}/orders.json?status=any`;
        const headers = {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken,
        };

        let shopifyOrders = [];
        try {
            const shopifyResponse = await axios.get(url, { headers });
            shopifyOrders = shopifyResponse.data.orders;
        } catch (shopifyError) {
            return res.status(400).json({ error: 'Failed to fetch orders from Shopify', details: shopifyError.message });
        }

        if (!shopifyOrders.length) {
            const allOrders = await Order.find({ store_name: storeName }).lean();
            return res.status(200).json(allOrders);
        }

        const customerIds = Array.from(new Set(shopifyOrders.map(order => order.customer?.id).filter(Boolean)));

        // let customerDataMap = new Map();
        if (customerIds.length > 0) {
            const customers = await Customer.find({ shopifyId: { $in: customerIds } }).lean();
            customerDataMap = new Map(customers.map(customer => [customer.customer_id, customer]));
            console.log("Customer IDs: ", customerDataMap);
        }

        const existingOrders = await Order.find({
            order_number: { $in: shopifyOrders.map(o => o.order_number) },
            store_name: storeName
        }).lean();

        const orderMap = new Map(existingOrders.map(o => [o.order_number, o]));

        for (const shopifyOrder of shopifyOrders) {
            if (!shopifyOrder.order_number) continue;

            const existingOrder = orderMap.get(shopifyOrder.order_number);
            const shopifyOrderId = shopifyOrder.id || uuidv4();

            const customerId = shopifyOrder.customer?.id;
            let customerData = {};
            if (customerId) {
                customerData = await Customer.findOne({ shopifyId: customerId }).lean() || {};
                //console.log("Fetched Customer Data: ", customerData);
            }

            const orderData = {
                order_number: shopifyOrder.order_number,
                invoice_number: shopifyOrder.name || `#${shopifyOrder.order_number}`,
                date: shopifyOrder.created_at || new Date(),
                customer_name: shopifyOrder.customer
                    ? `${shopifyOrder.customer.first_name || ''} ${shopifyOrder.customer.last_name || ''}`.trim()
                    : null,
                total_price: shopifyOrder.total_price || 0,
                order_status_url: shopifyOrder.order_status_url || '',
                fulfillment_status: shopifyOrder.fulfillment_status || 'Unfulfilled',
                email: shopifyOrder.email || 'no-email@example.com',
                user_id: shopifyOrder.user_id || null,
                store_name: storeName,
                orderId: shopifyOrderId,
                note: shopifyOrder.note,
                current_subtotal_price: shopifyOrder.current_subtotal_price,
                processed_at: shopifyOrder.processed_at,
                payment_status: shopifyOrder.financial_status || 'pending',
                payment_gateway_names: shopifyOrder.payment_gateway_names || [],
                line_items: shopifyOrder.line_items || [],
                billing_address: shopifyOrder.billing_address,
                shipping_address: shopifyOrder.shipping_address,
                customer: customerData,
                total_shipping_price_set: shopifyOrder.total_shipping_price_set,
                total_discounts: shopifyOrder.total_discounts,
            };

            if (!existingOrder) {
                await Order.create(orderData);
            } else {
                await Order.findOneAndUpdate(
                    { order_number: shopifyOrder.order_number, store_name: storeName },
                    { $set: existingOrder },
                    { upsert: true, new: true }
                );
            }
        }

        // Fetch all orders from the database
        let allOrders = await Order.find({ store_name: storeName }).lean();

        const productIdsToFetch = new Set();
        allOrders.forEach(order => {
            order.line_items.forEach(item => {
                if (!item.hsn || !item.gst || !item.cess || !item.miniAmount || !item.minGst) {
                    if (item.product_id) {
                        productIdsToFetch.add(item.product_id);
                    }
                }
            });
        });

        let productDataMap = new Map();
        if (productIdsToFetch.size > 0) {
            const products = await Product.find({ shopify_id: { $in: Array.from(productIdsToFetch) } }).lean();
            productDataMap = new Map(products.map(p => [p.shopify_id, p]));
        }

        allOrders = await Promise.all(allOrders.map(async (order) => {
            const updatedLineItems = await Promise.all(order.line_items.map(async (item) => {
                const productData = productDataMap.get(`${item.product_id}`) || {};

                const updatedItem = {
                    ...item,
                    hsn: item.hsn || productData.hsn || null,
                    gst: item.gst || productData.gst || null,
                    cess: item.cess || productData.cess || null,
                    miniAmount: item.miniAmount || productData.miniAmount || null,
                    minGst: item.minGst || productData.minGst || null
                };

                if (!item.hsn || !item.gst || !item.cess || !item.miniAmount || !item.minGst) {
                    await Order.updateOne(
                        { _id: order._id, "line_items.product_id": item.product_id },
                        { $set: { "line_items.$": updatedItem } }
                    );
                }

                return updatedItem;
            }));

            return {
                ...order,
                line_items: updatedLineItems
            };
        }));

        res.status(200).json(allOrders);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});



module.exports = router;