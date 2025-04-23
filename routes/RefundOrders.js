const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const RefundedOrder = require("../models/RefundedOrder");
const Product = require('../models/product');
const router = express.Router();

router.get("/refunded", async (req, res) => {
  try {
    const storeName = req.headers["store-name"];
    const apiVersion = req.headers["api-version"];
    const accessToken = req.headers["access-token"];

    if (!storeName || !apiVersion || !accessToken) {
      return res.status(400).json({ error: "Missing required headers" });
    }

    const sanitizedStoreName = String(storeName).trim();
    const sanitizedApiVersion = String(apiVersion).trim();

    if (sanitizedStoreName.length > 100 || sanitizedApiVersion.length > 20) {
      return res.status(400).json({ error: "Invalid store-name or api-version" });
    }

    const url = `https://${sanitizedStoreName}/admin/api/${sanitizedApiVersion}/orders.json?financial_status=refunded`;
    const headers = {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    };

    let shopifyRefundedOrders = [];
    try {
      const shopifyResponse = await axios.get(url, { headers });
      shopifyRefundedOrders = shopifyResponse.data.orders || [];
    } catch (shopifyError) {
      console.error(
        " Shopify API Error:",
        shopifyError.response?.data || shopifyError.message,
      );
      return res
        .status(400)
        .json({
          error: "Failed to fetch refunded orders",
          details: shopifyError.message,
        });
    }

    // If no refunded orders from Shopify, return existing ones from the database
    if (shopifyRefundedOrders.length === 0) {
      console.log(
        `No refunded orders found for ${storeName}. Fetching saved orders from DB.`,
      );
      const allRefundedOrders = await RefundedOrder.find().lean();
      return res.status(200).json(allRefundedOrders);
    }

    const bulkOperations = [];
    for (const shopifyRefundedOrder of shopifyRefundedOrders) {
      if (!shopifyRefundedOrder.order_number) {
        console.warn(
          `Skipping refunded order with missing order_number:`,
          shopifyRefundedOrder,
        );
        continue;
      }

      const orderNumber = parseInt(shopifyRefundedOrder.order_number, 10);
      const orderId = shopifyRefundedOrder.id;
      const cn_suffix = generateUniqueSuffix();
      // **Upsert: Insert only if the order does not exist**
      bulkOperations.push({
        updateOne: {
          filter: { order_number: orderNumber }, // Ensure uniqueness
          update: {
            $setOnInsert: {
              order_id: orderId,
              order_number: orderNumber,
              order_date: new Date(shopifyRefundedOrder.created_at)
                .toISOString()
                .split("T")[0],
              customer_name: shopifyRefundedOrder.customer
                ? `${shopifyRefundedOrder.customer.first_name || ""} ${shopifyRefundedOrder.customer.last_name || ""}`.trim()
                : null,
              tax_amount: shopifyRefundedOrder.tax_lines?.[0]?.price || null,
              total_price: parseFloat(shopifyRefundedOrder.total_price) || 0,
              cancellation_date:
                shopifyRefundedOrder.refunds?.[0]?.processed_at || null,
              status: shopifyRefundedOrder.financial_status,
              cn_prefix: "CN", // Default prefix
              cn_suffix: cn_suffix, // Generate suffix
              cn_number: `CN${cn_suffix}`, 
            },
          },
          upsert: true, // Prevent duplicates
        },
      });
    }
    // Execute bulk insert/update operation
    if (bulkOperations.length > 0) {
      try {
        await RefundedOrder.bulkWrite(bulkOperations, { ordered: false });
        console.log(`✅ Synced ${bulkOperations.length} refunded orders.`);
      } catch (dbError) {
        console.error(`❌ Database error during bulk upsert:`, dbError);
      }
    }
    const allRefundedOrders = await RefundedOrder.find().lean({ virtuals: true });
    res.status(200).json(allRefundedOrders);
  } catch (error) {
    console.error("API Error:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

// PUT endpoint for updating refunded orders
router.put("/refunded/:order_number", async (req, res) => {
  const { order_number } = req.params;
  const { cancellation_date, cn_prefix, cn_suffix } = req.body;

  try {
    // Find the order by order_number
    const refundedOrder = await RefundedOrder.findOne({
      order_number: order_number,
    });

    if (!refundedOrder) {
      return res.status(404).json({ message: "Refunded order not found" });
    }

    // Update the order fields
    if (cancellation_date !== undefined) {
      refundedOrder.cancellation_date = cancellation_date
        ? new Date(cancellation_date)
        : null;
    }

    // Update CN Prefix and CN Suffix separately
    if (cn_prefix) refundedOrder.cn_prefix = cn_prefix;
    if (cn_suffix) refundedOrder.cn_suffix = cn_suffix;

    // Validate unique cn_suffix before saving
    if (cn_suffix) {
      const existingOrderWithCN = await RefundedOrder.findOne({
        cn_suffix: cn_suffix,
        order_number: { $ne: order_number },
      });
      if (existingOrderWithCN) {
        return res
          .status(400)
          .json({ message: "Credit Note Suffix already exists" });
      }
    }

    await refundedOrder.save();
    res.json({ message: "Order updated successfully", refundedOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


// 📌 API: Get Refunded Orders with HSN, GST, and CESS
router.get('/refunded-orders-report', async (req, res) => {
  try {
      const storeName = req.headers['store-name'];
      const apiVersion = req.headers['api-version'];
      const accessToken = req.headers['access-token'];

      if (!storeName || !apiVersion || !accessToken) {
          return res.status(400).json({ error: 'Missing required headers: store-name, api-version, access-token' });
      }

      // 🔹 Step 1: Fetch all orders
      const ordersUrl = `http://localhost:3001/api/orders`;
      const headers = { 
          'Content-Type': 'application/json',
          'access-token' : accessToken,
          'api-version': apiVersion,
          'store-name': storeName
       };

      const ordersResponse = await axios.get(ordersUrl, { headers });
      const orders = ordersResponse.data;

      if (!orders || orders.length === 0) {
          return res.status(404).json({ error: 'No orders found' });
      }

      // 🔹 Step 2: Filter orders with "refunded" status
      const refundedOrders = orders.filter(order => order.payment_status === 'refunded');

      if (refundedOrders.length === 0) {
          return res.status(404).json({ error: 'No refunded orders found' });
      }

      // 🔹 Step 3: Fetch HSN, GST, and CESS for each product in refunded orders
      const fetchTaxDetails = async (productId) => {
          try {
              const metafieldUrl = `https://${storeName}/admin/api/${apiVersion}/products/${productId}/metafields.json`;
              const metafieldsResponse = await axios.get(metafieldUrl, { headers });

              const metafields = metafieldsResponse.data.metafields;
              const hsn = metafields.find(m => m.key === 'hsn')?.value || null;
              const gst = metafields.find(m => m.key === 'gst')?.value || null;
              const cess = metafields.find(m => m.key === 'cess')?.value || null;

              return { hsn, gst, cess };
          } catch (error) {
              console.error(`🚨 Error fetching metafields for product ${productId}:`, error.message);
              return { hsn: null, gst: null, cess: null };
          }
      };

      // 🔹 Step 4: Map refunded orders to include HSN, GST, and CESS
      const ordersWithTaxDetails = await Promise.all(refundedOrders.map(async (order) => {
          const updatedLineItems = await Promise.all(order.line_items.map(async (item) => {
              const { product_id, title, quantity, price } = item;
              const { hsn, gst, cess } = await fetchTaxDetails(product_id);

              return { product_id, title, quantity, price, hsn, gst, cess };
          }));

          return { ...order, line_items: updatedLineItems };
      }));

      res.status(200).json(ordersWithTaxDetails);

  } catch (error) {
      console.error('🚨 API Error:', error);
      res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

router.get('/refunded-orders-with-tax', async (req, res) => {
  try {
    const storeName = req.headers['store-name'];
    const apiVersion = req.headers['api-version'];
    const accessToken = req.headers['access-token'];

    if (!storeName || !apiVersion || !accessToken) {
        return res.status(400).json({ error: 'Missing required headers: store-name, api-version, access-token' });
    }

    // 🔹 Step 1: Fetch refunded orders
    const refundedUrl = `http://localhost:3001/api/refunded`;
    const headers = { 
      'Content-Type': 'application/json',
      'access-token' : accessToken,
      'api-version': apiVersion,
      'store-name': storeName
     };

    const refundedResponse = await axios.get(refundedUrl, { headers });
    const refundedOrders = refundedResponse.data;

    if (!refundedOrders || refundedOrders.length === 0) {
        return res.status(404).json({ error: 'No refunded orders found' });
    }

    // 🔹 Step 2: Extract product IDs and order numbers
    const orderNumbers = refundedOrders.map(order => order.order_number);

    // 🔹 Step 3: Fetch order details (Price from `line_items` & Shipping)
    const ordersUrl = `http://localhost:3001/api/orders`; // Your Orders API
    const ordersResponse = await axios.get(ordersUrl, { headers });
    const ordersData = ordersResponse.data;

    // Create maps for order prices & shipping amounts
    const orderPriceMap = new Map();
    const shippingMap = new Map();

    ordersData.forEach(order => {
        let totalProductPrice = 0;

        // Sum up product prices from line_items
        if (order.line_items && order.line_items.length > 0) {
            totalProductPrice = order.line_items.reduce((sum, item) => sum + parseFloat(item.price || "0.00"), 0);
        }

        orderPriceMap.set(order.order_number, totalProductPrice.toFixed(2)); 
        shippingMap.set(order.order_number, order.total_shipping_price_set?.shop_money?.amount || "0.00");
    });

    // 🔹 Step 4: Fetch HSN, GST, and CESS from Product Database
    const productIds = refundedOrders.map(order => order._id.toString());
    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map(products.map(product => [product._id.toString(), product]));

    // 🔹 Step 5: Merge all details
    const ordersWithDetails = refundedOrders.map(order => {
        const product = productMap.get(order._id.toString());

        return {
            ...order,
            hsn: product?.hsn || null,
            gst: product?.gst || null,
            cess: product?.cess || null,
            price: orderPriceMap.get(order.order_number) || "0.00",
            shipping_amount: shippingMap.get(order.order_number) || "0.00"
        };
    });

    // 🔹 Step 6: Return the final response
    res.status(200).json(ordersWithDetails);

} catch (error) {
    console.error('🚨 API Error:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
}
});

// api for credit note report - report center
router.get("/aggregated-refunded-orders", async (req, res) => {
  try {
    const storeName = req.headers['store-name'];
    const apiVersion = req.headers['api-version'];
    const accessToken = req.headers['access-token'];

    if (!storeName || !apiVersion || !accessToken) {
        return res.status(400).json({ error: 'Missing required headers: store-name, api-version, access-token' });
    }
      
    const { startDate, endDate, filterType } = req.query; 

      if (!startDate || !endDate || !filterType) {
          return res.status(400).json({ message: "Missing required query parameters" });
      }
      // Validate filterType
      if (!["order_date", "cancellation_date"].includes(filterType)) {
        return res.status(400).json({ message: "Invalid filterType" });
      }
      // Fetch refunded orders with tax
      const { data: orders } = await axios.get("http://localhost:3001/api/refunded-orders-with-tax", {
          headers: {
            'Content-Type': 'application/json',
            'access-token' : accessToken,
            'api-version': apiVersion,
            'store-name': storeName
          },
      });

      console.log("Fetched Orders:", orders); // Debug: Log all orders
      const formatDate = (dateStr) => {
        if (!dateStr) return null; // ✅ Avoids invalid date error
        const parsedDate = new Date(dateStr);
        return isNaN(parsedDate) ? null : parsedDate.toISOString().split("T")[0]; // ✅ Check if valid date
    };
    
      if (!Array.isArray(orders) || orders.length === 0) {
          console.log("No refunded orders found.");
          return res.status(200).json({ message: "No refunded orders found", orders: [] });
      }

      // Convert start and end date to YYYY-MM-DD format (removes time)
      const start = formatDate(startDate);
      const end = formatDate(endDate);
      if (!start || !end) {
        return res.status(400).json({ message: "Invalid start or end date format" });
    }
      // Filter orders based on the selected date type
      const filteredOrders = orders.filter((order) => {
        const orderDate = formatDate(order[filterType]); // Convert order date safely
        return orderDate && orderDate >= start && orderDate <= end; // ✅ Check if orderDate is valid
      });

      console.log("Filtered Orders:", filteredOrders); // Debug: Log filtered orders

      if (filteredOrders.length === 0) {
          return res.status(200).json({ message: "No orders found in the given date range"});
      }

      // Initialize total sums
      let totalPrice = 0;
      let totalShipping = 0;
      let totalCgst = 0;
      let totalSgst = 0;
      let totalIgst = 0;
      let totalCess = 0;

      // Function to calculate tax amounts
      const calculateTaxes = (price, gstRate, cessRate) => {
          const cessAmount = (price * cessRate) / 100;
          const cgstAmount = (price * gstRate) / 200;
          const sgstAmount = (price * gstRate) / 200;
          const igstAmount = cgstAmount + sgstAmount;
          return { cessAmount, cgstAmount, sgstAmount, igstAmount };
      };

      // Process each order
      filteredOrders.forEach((order) => {
          const { price, gstRate, cessRate, shippingAmount } = order;
          const { cessAmount, cgstAmount, sgstAmount, igstAmount } = calculateTaxes(price, gstRate, cessRate);
          // Sum up totals
          totalPrice += isNaN(price) ? 0 : Number(price);
          totalShipping += isNaN(shippingAmount) ? 0 : Number(shippingAmount);
          totalCgst += isNaN(cgstAmount) ? 0 : Number(cgstAmount);
          totalSgst += isNaN(sgstAmount) ? 0 : Number(sgstAmount);
          totalIgst += isNaN(igstAmount) ? 0 : Number(igstAmount);
          totalCess += isNaN(cessAmount) ? 0 : Number(cessAmount);
      });
      const formatTotal = (value) => (isNaN(value) || value === null ? 0 : Number(value.toFixed(2)));
      // Response JSON
      res.json({
        totalOrders: filteredOrders.length,
        totalPrice: formatTotal(totalPrice),
        totalShipping: formatTotal(totalShipping),
        totalCgst: formatTotal(totalCgst),
        totalSgst: formatTotal(totalSgst),
        totalIgst: formatTotal(totalIgst),
        totalCess: formatTotal(totalCess),
        orders: filteredOrders,
      });
  } catch (error) {
      console.error("Error fetching refunded orders:", error);
      res.status(500).json({ message: "Internal Server Error" });
  }
});


function generateUniqueSuffix() {
  return Math.floor(100000 + Math.random() * 900000);
}


module.exports = router;
