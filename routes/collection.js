const express = require('express');
const router = express.Router();
const axios = require('axios');
const Collection = require('../models/collection');
const Product = require('../models/product');

// @route   GET /api/collections/:store
// @desc    Get collections by store name and save to MongoDB if not exists
// @access  Public
router.get('/', async (req, res) => {
    const storeName = req.headers['store-name'];
    const accessToken = req.headers['access-token'];
    const searchKeyword = req.query.search;

    try {
        // Call Shopify API
        const response = await axios.get(`https://${storeName}/admin/api/2025-01/custom_collections.json`, {
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken
            }
        });

        const collections = response.data.custom_collections;

        for (const collection of collections) {
            await Collection.updateOne(
                { store_name: storeName, id: collection.id },
                {
                    $set: {
                        handle: collection.handle,
                        title: collection.title,
                        updated_at: collection.updated_at,
                        body_html: collection.body_html,
                        published_at: collection.published_at,
                        sort_order: collection.sort_order,
                        template_suffix: collection.template_suffix,
                        published_scope: collection.published_scope,
                        admin_graphql_api_id: collection.admin_graphql_api_id,
                    }
                },
                { upsert: true }
            );
        }

        let allCollections;
        if (searchKeyword) {
            // Filter collections based on the search keyword
            allCollections = await Collection.find({
                store_name: storeName,
                title: { $regex: searchKeyword, $options: 'i' } // Case-insensitive search
            });
        } else {
            // Return all collections if no search keyword is provided
            allCollections = await Collection.find({ store_name: storeName });
        }

        return res.json(allCollections);

    } catch (error) {
        console.error(error);
        res.status(500).send({
            error: error
        });
    }
});

router.put('/collections/update', async (req, res) => {
    const storeName = req.headers['store-name'];
    const accessToken = req.headers['access-token'];
    const collections = req.body.collections;

    try {
        const updatedCollections = [];

        for (const collectionData of collections) {
            const { id, mini_amount, mini_gst, gst, hsn_code, cess } = collectionData;

            // Call Shopify API to get the collection details
            const response = await axios.get(`https://${storeName}/admin/api/2025-01/custom_collections/${id}.json`, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Access-Token': accessToken
                }
            });

            const collection = response.data.custom_collection;

            // Update the collection in MongoDB with custom fields
            await Collection.updateOne(
                { store_name: storeName, id: collection.id },
                {
                    $set: {
                        handle: collection.handle,
                        title: collection.title,
                        updated_at: collection.updated_at,
                        body_html: collection.body_html,
                        published_at: collection.published_at,
                        sort_order: collection.sort_order,
                        template_suffix: collection.template_suffix,
                        published_scope: collection.published_scope,
                        admin_graphql_api_id: collection.admin_graphql_api_id,
                        mini_amount: mini_amount,
                        mini_gst: mini_gst,
                        gst: gst,
                        hsn_code: hsn_code,
                        cess: cess,
                    }
                },
                { upsert: true }
            );

            // Fetch products associated with the collection
            const productsResponse = await axios.get(`https://${storeName}/admin/api/2025-01/products.json?collection_id=${id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Access-Token': accessToken
                }
            });

            const products = productsResponse.data.products;

            for (const product of products) {
                await Product.updateOne(
                    { store_name: storeName, handle: product.handle },
                    {
                        $set: {
                            gst: gst,
                            hsn: hsn_code,
                            miniAmount: mini_amount,
                            minGst: mini_gst,
                            cess: cess,
                        }
                    },
                    { upsert: true } // yahan upsert ko true kar diya hai taki product exist na kare to naya create ho jaye
                );
            }

            const updatedCollection = await Collection.findOne({ store_name: storeName, id: collection.id });
            updatedCollections.push(updatedCollection);
        }

        return res.json(updatedCollections);

    } catch (error) {
        console.error(error);
        res.status(500).send({
            error: error.message
        });
    }
});

router.put('/:id', async (req, res) => {
    const storeName = req.headers['store-name'];
    const accessToken = req.headers['access-token'];
    const collectionId = req.params.id;

    const { mini_amount, mini_gst, gst, hsn_code, cess } = req.body;

    try {
        // Call Shopify API to get the collection details
        const response = await axios.get(`https://${storeName}/admin/api/2025-01/custom_collections/${collectionId}.json`, {
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken
            }
        });

        const collection = response.data.custom_collection;

        // Update the collection in MongoDB with custom fields
        await Collection.updateOne(
            { store_name: storeName, id: collection.id },
            {
                $set: {
                    handle: collection.handle,
                    title: collection.title,
                    updated_at: collection.updated_at,
                    body_html: collection.body_html,
                    published_at: collection.published_at,
                    sort_order: collection.sort_order,
                    template_suffix: collection.template_suffix,
                    published_scope: collection.published_scope,
                    admin_graphql_api_id: collection.admin_graphql_api_id,
                    mini_amount: mini_amount,
                    mini_gst: mini_gst,
                    gst: gst,
                    hsn_code: hsn_code,
                    cess: cess,
                }
            },
            { upsert: true }
        );


        const productsResponse = await axios.get(`https://${storeName}/admin/api/2025-01/products.json?collection_id=${collectionId}`, {
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': accessToken
            }
        });


        const products = productsResponse.data.products;

        for (const product of products) {
            await Product.updateOne(
                { store_name: storeName, handle: product.handle },
                {
                    $set: {
                        gst: gst,
                        hsn: hsn_code,
                        miniAmount: mini_amount,
                        minGst: mini_gst,
                        cess: cess,
                    }
                },
                { upsert: true }
            );
        }


        const updatedCollection = await Collection.findOne({ store_name: storeName, id: collection.id });


        return res.json(updatedCollection);

    } catch (error) {
        console.error(error);
        res.status(500).send({
            error: error
        });
    }
});

module.exports = router;