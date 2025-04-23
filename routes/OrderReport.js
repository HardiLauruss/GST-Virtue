const express = require("express");
const router = express.Router();
const OrderReport = require("../models/OrderReport");

router.get("/orderReport", async (req, res) => {
  try {
    console.log("Received Headers:", req.headers);

    const apiVersion = req.headers["api-version"];
    const storeName = req.headers["store-name"];
    const accessToken = req.headers["access-token"];

    if (!apiVersion || !storeName || !accessToken) {
      console.error("Missing Headers:", { apiVersion, storeName, accessToken });
      return res.status(400).json({
        message: "Missing required headers",
        receivedHeaders: req.headers,
      });
    }

    let { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start and End date are required" });
    }

    const url = `http://localhost:3001/api/orders`;
    console.log("Fetching Shopify URL:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "access-token": accessToken,
        "Content-Type": "application/json",
        "store-name": storeName,
        "api-version": apiVersion,
      },
    });

    const responseData = await response.json();
    console.log("Fetched Data:", responseData);

    if (!responseData || responseData.length === 0) {
      console.warn("No orders found from Shopify or invalid data.");
      return res.status(404).json({ message: "No orders found for the given date range" });
    }

    let orders = responseData;

    // Calculate total subtotal price (sum of line item prices)
    let totalSubtotalPrice = 0;
    let totalCess = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;

    orders = orders.map(order => {
      let orderCess = 0;
      let orderCGST = 0;
      let orderSGST = 0;
      let orderIGST = 0;
      let orderSubtotal = 0;

      order.line_items.forEach(item => {
        const price = parseFloat(item.price) || 0;
        const gstRate = parseFloat(item.gst) || 0;
        const cessRate = parseFloat(item.cess) || 0;

        orderSubtotal += price;
        const cessAmount = (price * cessRate) / 100;
        const cgstAmount = (price * gstRate) / 200;
        const sgstAmount = (price * gstRate) / 200;
        const igstAmount = cgstAmount + sgstAmount;

        orderCess += cessAmount;
        orderCGST += cgstAmount;
        orderSGST += sgstAmount;
        orderIGST += igstAmount;
      });

      totalSubtotalPrice += orderSubtotal;
      totalCess += orderCess;
      totalCGST += orderCGST;
      totalSGST += orderSGST;
      totalIGST += orderIGST;

      return {
        ...order,
        subtotal_price: orderSubtotal.toFixed(2),
        cess: orderCess.toFixed(2),
        cgst: orderCGST.toFixed(2),
        sgst: orderSGST.toFixed(2),
        igst: orderIGST.toFixed(2),
      };
    });

    let totalShippingAmount = orders.reduce(
      (sum, order) => sum + (parseFloat(order.total_shipping_price_set?.shop_money?.amount) || 0),
      0
    );

    res.json({
      total_subtotal_price: totalSubtotalPrice.toFixed(2),
      total_shipping_amount: totalShippingAmount.toFixed(2),
      total_cess: totalCess.toFixed(2),
      total_cgst: totalCGST.toFixed(2),
      total_sgst: totalSGST.toFixed(2),
      total_igst: totalIGST.toFixed(2),
      orders
    });
  } catch (error) {
    console.error("Main error:", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});



module.exports = router;