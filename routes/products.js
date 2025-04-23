const express = require("express");
const Product = require("../models/product"); // Make sure the correct path to the model is used
const router = express.Router();
const mongoose = require("mongoose");
const axios = require('axios');
const bodyParser = require('body-parser');

router.get('/collection', async (req, res) => {
  const collectionId = req.query.collection_id;
  const storeName = req.headers['store-name'];
  const accessToken = req.headers['access-token'];

  try {
    // **Shopify API Call**
    const response = await axios.get(`https://${storeName}/admin/api/2025-01/collections/${collectionId}/products.json`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
      }
    });

    const shopifyProducts = response.data.products;
    const shopifyProductIds = shopifyProducts.map(product => product.id);

    // **MongoDB se pehle se existing products fetch karo**
    const existingProducts = await Product.find({
      store_name: storeName,
      shopify_id: { $in: shopifyProductIds } // ✅ Shopify ID ke base pe check karna
    }).lean();

    // **Product merging logic**
    const mergedProducts = shopifyProducts.map(shopifyProduct => {
      const existingProduct = existingProducts.find(product => `${product.shopify_id}` === `${shopifyProduct.id}`);
      if (existingProduct) {
        return {
          ...shopifyProduct,
          gst: existingProduct.gst,
          hsn: existingProduct.hsn,
          cess: existingProduct.cess,
          miniAmount: existingProduct.miniAmount,
          minGst: existingProduct.minGst,
          Amount: existingProduct.Amount,
          ...existingProduct // ✅ MongoDB ka data merge kar do
        };
      } else {
        return shopifyProduct;
      }
    });

    // **Sirf naye products ko hi MongoDB me add karo**
    const newProducts = shopifyProducts.filter(product =>
      !existingProducts.some(existing => `${existing.shopify_id}` === `${product.id}`)
    );

    // **New products ko insert/update karo**
    for (const product of newProducts) {
      await Product.findOneAndUpdate(
        { id: product.id, store_name: storeName },  // ✅ Shopify `id` ka use karein
        {
          $setOnInsert: {
            id: product.id,  // ✅ Shopify ID
            store_name: storeName,
            title: product.title,
            body_html: product.body_html,
            vendor: product.vendor,
            product_type: product.product_type,
            created_at: product.created_at,
            handle: product.handle,
            updated_at: product.updated_at,
            published_at: product.published_at,
            template_suffix: product.template_suffix,
            published_scope: product.published_scope,
            tags: product.tags,
            status: product.status,
            admin_graphql_api_id: product.admin_graphql_api_id,
            variants: product.variants,
            options: product.options,
            images: product.images,
            image: product.image
          }
        },
        { upsert: true, new: true }
      );
    }

    // **Final Response**
    return res.json(mergedProducts);

  } catch (error) {
    console.error(error);
    res.status(500).send({
      error: error.message
    });
  }
});



// // CREATE: Add a new product
// router.post("/", async (req, res) => {
//   try {
//     const { products } = req.body;

//     if (!Array.isArray(products) || products.length === 0) {
//       return res
//         .status(400)
//         .json({
//           message: "Products must be an array with at least one product.",
//         });
//     }

//     const processedProducts = [];

//     for (const product of products) {
//       const { id, title, gst, hsnCode, miniAmount, miniGst, cess } = product;

//       // Validate the ID format (must be numeric)
//       if (!id || isNaN(id)) {
//         return res
//           .status(400)
//           .json({
//             message: `Invalid product ID format for product: ${title}. ID must be numeric.`,
//           });
//       }

//       // Validate the title field
//       if (!title || title.trim() === "") {
//         return res
//           .status(400)
//           .json({ message: `Title is required for product ID: ${id}` });
//       }

//       console.log(`Processing product with ID: ${id}, Title: ${title}`);

//       // Upsert logic: if the product exists, update it; otherwise, insert it.
//       const updatedProduct = await Product.findOneAndUpdate(
//         { id }, // Find by product ID
//         { title, gst, hsnCode, miniAmount, miniGst, cess }, // Fields to update
//         { new: true, upsert: true, setDefaultsOnInsert: true }, // Upsert options
//       );

//       console.log("Upserted product:", updatedProduct);
//       processedProducts.push(updatedProduct);
//     }

//     res.status(200).json({
//       message: "Products processed successfully",
//       products: processedProducts,
//     });
//   } catch (error) {
//     console.error("Error processing products:", error.message);
//     res
//       .status(500)
//       .json({ message: "Failed to process products", error: error.message });
//   }
// });
// // READ: Get all products
// router.get("/", async (req, res) => {
//   try {
//     const products = await Product.find();
//     res.json(products);
//   } catch (error) {
//     res.status(500).json({ message: "Failed to fetch products" });
//   }
// });

// // READ: Get a single product by ID
// router.get("/:id", async (req, res) => {
//   try {
//     const identifier = req.params.id;

//     // Check if the identifier is a valid ObjectId
//     const isObjectId = mongoose.Types.ObjectId.isValid(identifier);

//     // Query based on _id (ObjectId) or id (string)
//     const query = isObjectId
//       ? { _id: identifier } // If it's a valid ObjectId, query by _id
//       : { id: identifier }; // Otherwise, query by id field

//     console.log(`Fetching product with query:`, query);

//     const product = await Product.findOne(query);

//     if (product) {
//       res.json({ success: true, title: product.title });
//     } else {
//       res.status(404).json({ success: false, message: "Product not found" });
//     }
//   } catch (error) {
//     console.error("Error fetching product:", error);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// });
// // UPDATE: Update an existing product
// router.put("/:id", async (req, res) => {
//   const productId = req.params.id;
//   console.log("Received update request for ID:", productId);

//   // Validate the ID format - FIX
//   if (!productId || !/^\d+$/.test(productId)) {
//     return res
//       .status(400)
//       .json({
//         message: "Invalid product ID format. ID must be a numeric string.",
//       });
//   }

//   try {
//     const updatedProduct = await Product.findOneAndUpdate(
//       { id: productId },
//       req.body,
//       { new: true },
//     );

//     console.log("Updated product from db", updatedProduct);
//     if (!updatedProduct) {
//       console.log("Product not found in db for id", productId);
//       return res
//         .status(404)
//         .send({ message: `Product not found for id: ${productId}` });
//     }
//     res.send(updatedProduct);
//   } catch (error) {
//     console.error("Error updating product", error);
//     res.status(500).send({ message: "Error updating product" });
//   }
// });

// module.exports = router;


router.get('/', async (req, res) => {
  try {
    const storeName = req.headers['store-name'];
    const apiVersion = req.headers['api-version'];
    const accessToken = req.headers['access-token'];

    if (!storeName || !apiVersion || !accessToken) {
      return res.status(400).json({ error: 'Missing required headers: store-name, api-version, access-token' });
    }

    const url = `https://${storeName}/admin/api/${apiVersion}/products.json`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    };

    let shopifyProducts = [];
    try {
      const shopifyResponse = await axios.get(url, { headers });
      shopifyProducts = shopifyResponse.data.products;
    } catch (shopifyError) {
      console.error('🚨 Shopify API Error:', shopifyError.response?.data || shopifyError.message);
      return res.status(400).json({ error: 'Failed to fetch products from Shopify', details: shopifyError.message });
    }

    if (!shopifyProducts || shopifyProducts.length === 0) {
      const allProducts = await Product.find({ store_name: storeName }).lean();

      // **Modification: Fetch price from the first variant**
      const productsWithPrice = allProducts.map(product => {
        let productPrice = null; // Initialize to null

        if (product?.variants?.length > 0) { // Short and safe check
          productPrice = product.variants[0].price;
        }

        return {
          ...product,
          price: productPrice // Add 'price' field to the product object
        };
      });

      return res.status(200).json(productsWithPrice);
    }

    const existingProducts = await Product.find({
      handle: { $in: shopifyProducts.map(p => p.handle) },
      store_name: storeName
    }).lean();

    const productMap = new Map(existingProducts.map(p => [p.handle, p]));

    const operations = shopifyProducts.map((shopifyProduct) => {
      return (async () => {
        if (!shopifyProduct || !shopifyProduct.title || !shopifyProduct.handle) { // Check if shopifyProduct exists
          console.warn(`Skipping product with missing title/handle or is null/undefined:`, shopifyProduct);
          return;
        }

        let productPrice = null; // Initialize to null

        if (shopifyProduct?.variants?.length > 0) { // Short and safe check
          productPrice = shopifyProduct.variants[0].price;
        }

        const productData = {
          id:shopifyProduct.id,
          shopify_id: shopifyProduct.id,
          store_name: storeName,
          title: shopifyProduct.title,
          body_html: shopifyProduct.body_html,
          vendor: shopifyProduct.vendor,
          product_type: shopifyProduct.product_type,
          created_at: shopifyProduct.created_at,
          handle: shopifyProduct.handle,
          updated_at: shopifyProduct.updated_at,
          published_at: shopifyProduct.published_at,
          template_suffix: shopifyProduct.template_suffix,
          published_scope: shopifyProduct.published_scope,
          tags: shopifyProduct.tags,
          status: shopifyProduct.status,
          admin_graphql_api_id: shopifyProduct.admin_graphql_api_id,
          variants: shopifyProduct.variants,
          options: shopifyProduct.options,
          images: shopifyProduct.images,
          image: shopifyProduct.image,
          price: productPrice,
        };

        if (!existingProducts) {
          return Product.create(productData);
        } else {
          return Product.findOneAndUpdate(
            { handle: shopifyProduct.handle, store_name: storeName },
            { $set: productData },
            { upsert: true, new: true }
          );
        }
      })();
    });

    await Promise.all(operations);
    const allProducts = await Product.find({ store_name: storeName }).lean();
    // **Modification: Fetch price from the first variant**
    const productsWithPrice = allProducts.map(product => {
      let productPrice = null; // Initialize to null

      if (product?.variants?.length > 0) { // Short and safe check
        productPrice = product.variants[0].price;
      }

      return {
        ...product,
        price: productPrice // Add 'price' field to the product object
      };
    });

    res.status(200).json(productsWithPrice);

  } catch (error) {
    console.error('🚨 API Error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});


router.get('/missing-gst-hsn', async (req, res) => {
  try {
    const storeName = req.headers['store-name'];
    const apiVersion = req.headers['api-version'];
    const accessToken = req.headers['access-token'];

    if (!storeName || !apiVersion || !accessToken) {
      return res.status(400).json({ error: 'Missing required headers: store-name, api-version, access-token' });
    }

    let products = await Product.find({
      store_name: storeName,
      $or: [
        { gst: { $in: [0, "0", null, ""] } },
        { hsn: { $in: [0, "0", null, ""] } }
      ]
    }).lean();

    console.log("Fetched Products from DB:", products);

    // Ensure valid product IDs (use admin_graphql_api_id instead of id)
    products = products.filter(product => 
      product.admin_graphql_api_id && typeof product.admin_graphql_api_id === "string" && product.admin_graphql_api_id.trim() !== ""
    );

    console.log("Valid Products After Filtering:", products);

    if (products.length === 0) {
      console.error("No valid product IDs found.");
      return res.status(400).json({ error: "No valid product IDs found" });
    }

    const updatedProducts = [];
    const newProducts = [];

    for (const product of products) {
      const { admin_graphql_api_id, gst, hsn, cess, miniAmount, minGst } = product;

      // Extract numeric product ID from admin_graphql_api_id
      const numericId = admin_graphql_api_id.replace("gid://shopify/Product/", "");

      let existingProduct = await Product.findOne({ admin_graphql_api_id });

      if (existingProduct) {
        let updateFields = {
          gst: gst !== undefined ? gst.toString() : existingProduct.gst,
          hsn: hsn !== undefined ? hsn : existingProduct.hsn,
          cess: !isNaN(parseFloat(cess)) ? parseFloat(cess) : existingProduct.cess,
          miniAmount: !isNaN(parseFloat(miniAmount)) ? parseFloat(miniAmount) : existingProduct.miniAmount,
          minGst: !isNaN(parseFloat(minGst)) ? parseFloat(minGst) : existingProduct.minGst,
          updatedAt: new Date(),
        };

        let updatedProduct = await Product.findOneAndUpdate(
          { admin_graphql_api_id },
          { $set: updateFields },
          { new: true, runValidators: true }
        );

        updatedProducts.push(updatedProduct);
      } else {
        const shopifyUrl = `https://${storeName}.myshopify.com/admin/api/${apiVersion}/products/${numericId}.json`;
        try {
          const shopifyResponse = await axios.get(shopifyUrl, {
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": accessToken,
            },
          });
          const shopifyProduct = shopifyResponse.data.product;
          if (!shopifyProduct) {
            return res.status(404).json({ error: "Product not found in Shopify" });
          }
          const newProduct = await Product.create({
            admin_graphql_api_id,
            title: shopifyProduct.title,
            gst: gst ? gst.toString() : "",
            hsn: hsn || "",
            cess: !isNaN(parseFloat(cess)) ? parseFloat(cess) : null,
            miniAmount: !isNaN(parseFloat(miniAmount)) ? parseFloat(miniAmount) : null,
            minGst: !isNaN(parseFloat(minGst)) ? parseFloat(minGst) : null,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          newProducts.push(newProduct);
        } catch (shopifyError) {
          console.error("Shopify API Error:", shopifyError.response?.data || shopifyError.message);

          return res.status(shopifyError.response?.status || 500).json({
            error: shopifyError.response?.data || "Error fetching product from Shopify",
          });
        }
      }
    }
    return res.status(200).json({
      message: "Products processed successfully",
      updatedProducts,
      newProducts,
    });

  } catch (error) {
    console.error("Server Error:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});


router.put('/update-multiple', async (req, res) => {
  try {
    const { products } = req.body;
    const storeName = req.headers['store-name'];

    if (!storeName) {
      return res.status(400).json({ error: 'Missing required header: store-name' });
    }

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty products array' });
    }

    const bulkOperations = products.map(product => {
      const { handle, miniAmount, minGst, gst, hsn, cess } = product;

      if (!handle) {
        return null;
      }

      const updateFields = {};
      if (miniAmount !== undefined) updateFields['miniAmount'] = miniAmount;
      if (minGst !== undefined) updateFields['minGst'] = minGst;
      if (gst !== undefined) updateFields['gst'] = gst;
      if (hsn !== undefined) updateFields['hsn'] = hsn;
      if (cess !== undefined) updateFields['cess'] = cess;

      return {
        updateOne: {
          filter: { handle, store_name: storeName },
          update: { $set: updateFields },
          upsert: true
        }
      };
    }).filter(op => op !== null);

    if (bulkOperations.length === 0) {
      return res.status(400).json({ error: 'No valid products to update' });
    }

    await Product.bulkWrite(bulkOperations);

    res.status(200).json({ message: 'Products updated successfully' });
  } catch (error) {
    console.error('🚨 Update API Error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const storeName = req.headers["store-name"];
    const apiVersion = req.headers["api-version"];
    const accessToken = req.headers["access-token"];
    let { id, gst, hsn, cess, miniAmount, minGst } = req.body;

    console.log("Received request with body:", req.body);

    // Validate required headers
    if (!storeName || !apiVersion || !accessToken) {
      return res.status(400).json({ error: "Missing required headers" });
    }

    // Validate and extract the numeric product ID
    if (!id) {
      return res.status(400).json({ error: "Product ID is required" });
    }
    const numericId = id.replace("gid://shopify/Product/", ""); // Extracts the numeric ID
    console.log("🔎 Searching product with id:", numericId);

    // Check if product exists in MongoDB
    let product = await Product.findOne({ id: numericId });

    if (product) {
      // Update only the specified fields if they exist
      let updateFields = {
        gst: gst !== undefined ? gst.toString() : product.gst,
        hsn: hsn !== undefined ? hsn : product.hsn,
        cess: !isNaN(parseFloat(cess)) ? parseFloat(cess) : product.cess,
        miniAmount: !isNaN(parseFloat(miniAmount)) ? parseFloat(miniAmount) : product.miniAmount,
        minGst: !isNaN(parseFloat(minGst)) ? parseFloat(minGst) : product.minGst,
        updatedAt: new Date(), // Update timestamp
      };

      console.log("🔄 Updating fields:", updateFields);
      console.log("Updating product with id:", numericId);
      // Use findOneAndUpdate for reliability
      let updatedProduct = await Product.findOneAndUpdate(
        { id: numericId },
        { $set: updateFields },
        { new: true, runValidators: true }
      );

      console.log("✅ Updated Product:", updatedProduct);
      return res.status(200).json({ message: "Product updated successfully", product: updatedProduct });
    }

    // If product doesn't exist, fetch from Shopify
    console.log(`❌ Product not found in MongoDB. Fetching from Shopify...`);
    const shopifyUrl = `https://${storeName}.myshopify.com/admin/api/${apiVersion}/products/${numericId}.json`;

    try {
      const shopifyResponse = await axios.get(shopifyUrl, {
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
      });

      const shopifyProduct = shopifyResponse.data.product;

      if (!shopifyProduct) {
        return res.status(404).json({ error: "Product not found in Shopify" });
      }

      // Insert new product in MongoDB
      console.log("🆕 Adding New Product:", shopifyProduct.title);
      const newProduct = await Product.create({
        id: numericId, // Store numeric ID
        title: shopifyProduct.title,
        gst: gst ? gst.toString() : "",
        hsn: hsn || "",
        cess: !isNaN(parseFloat(cess)) ? parseFloat(cess) : null,
        miniAmount: !isNaN(parseFloat(miniAmount)) ? parseFloat(miniAmount) : null,
        minGst: !isNaN(parseFloat(minGst)) ? parseFloat(minGst) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log("Product added successfully:", newProduct);
      return res.status(201).json({ message: "Product added successfully", product: newProduct });
    }

    catch (shopifyError) {
      console.error("Shopify API Error:", shopifyError.response?.data || shopifyError.message);

      return res.status(shopifyError.response?.status || 500).json({
        error: shopifyError.response?.data || "Error fetching product from Shopify",
      });
    }
  } catch (error) {
    console.error("Unexpected Error:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});


// GET method to get single product with id
router.get('/:productId', async (req, res) => {
  try {
    const storeName = req.headers['store-name'];
    const apiVersion = req.headers['api-version'];
    const accessToken = req.headers['access-token'];
    const productId = req.params.productId;  // Get the product ID from the URL parameters
    console.log("Product Id", productId);
    if (!storeName || !apiVersion || !accessToken) {
      return res.status(400).json({ error: 'Missing required headers: store-name, api-version, access-token' });
    }

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Try to find the product in MongoDB first
    const existingProduct = await Product.findOne({ id: productId });

    if (existingProduct) {
      // Product found in MongoDB, return it
      return res.status(200).json(existingProduct);
    }

    // If product not found in MongoDB, try to fetch it from Shopify
    const shopifyUrl = `https://${storeName}/admin/api/${apiVersion}/products/${productId}.json`;

    try { 
      const shopifyResponse = await axios.get(shopifyUrl, {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        }
      });

      const shopifyProduct = shopifyResponse.data.product;

      if (!shopifyProduct) {
        return res.status(404).json({ error: 'Product not found in Shopify' });
      }

      // Construct the product data from Shopify and save to MongoDB
      const newProduct = new Product({
        shopify_id: id,
        // id: productId,
        title: shopifyProduct.title,
        body_html: shopifyProduct.body_html,
        vendor: shopifyProduct.vendor,
        product_type: shopifyProduct.product_type,
        created_at: shopifyProduct.created_at,
        handle: shopifyProduct.handle,
        updated_at: shopifyProduct.updated_at,
        published_at: shopifyProduct.published_at,
        template_suffix: shopifyProduct.template_suffix,
        published_scope: shopifyProduct.published_scope,
        tags: shopifyProduct.tags,
        status: shopifyProduct.status,
        admin_graphql_api_id: shopifyProduct.admin_graphql_api_id,
        variants: shopifyProduct.variants,
        options: shopifyProduct.options,
        images: shopifyProduct.images,
        image: shopifyProduct.image,
        gst: shopifyProduct.gst || '',
        hsn: shopifyProduct.hsn || "",
        cess: shopifyProduct.cess || '',
      });

      await newProduct.save();

      return res.status(200).json(newProduct);
    } catch (shopifyError) {
      console.error('🚨 Shopify API Error:', shopifyError);
      return res.status(500).json({ error: 'Error fetching product from Shopify', details: shopifyError.message });
    }

  } catch (error) {
    console.error('🚨 API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;