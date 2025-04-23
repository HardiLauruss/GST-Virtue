const express = require('express');
const router = express.Router();
const productModel = require('../models/productModel');

router.get('/', async (req, res) => {
    const { title, id } = req.query;

    try {
        let productInfo;

        if (title) {
            productInfo = await productModel.getProducts(title, 'title');
        } else if (id) {
            productInfo = await productModel.getProducts(id, 'id');
        } else {
            // Fetch all products if neither title nor id is provided
            productInfo = await productModel.getProducts();
        }

        if (!productInfo || productInfo.length === 0) {
            return res.status(404).json({ message: 'No product found' });
        }

        res.json(productInfo);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching products' });
    }
});


module.exports = router;