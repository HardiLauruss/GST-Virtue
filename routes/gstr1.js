const express = require('express');
const path = require('path');
const gstrReport = require('../models/gstrReport');

const router = express.Router();

router.get('/', async (req, res) => {
    const apiVersion = req.headers["api-version"];
    const storeName = req.headers["store-name"];
    const accessToken = req.headers["access-token"];
    const monthQuery = req.query.month;
    const orderType = req.query.type?.toLowerCase(); // 'b2b' or 'b2c'
    const yearQuery = req.query.year ? parseInt(req.query.year) : null;

    if (!apiVersion || !storeName || !accessToken) {
        console.error("Missing Headers:", { apiVersion, storeName, accessToken });
        return res.status(400).json({
            message: "Missing required headers",
            receivedHeaders: req.headers,
        });
    }

    // 🔍 Step 1: Check if report already exists
    const existingReport = await gstrReport.findOne({
        storeName,
        type: orderType,
        month: monthQuery,
        year: yearQuery,
    });

    if (existingReport) {
        return res.json(existingReport.reportData);
    }

    // 🔁 Step 2: If not found, fetch and process orders
    const url = `http://localhost:3001/api/orders`;

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
    if (!responseData || responseData.length === 0) {
        return res.status(404).json({ message: "No orders found for the given date range" });
    }

    const monthMap = {
        january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
        july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
    };

    const gstStateCodes = {
        AP: "37", AR: "12", AS: "18", BR: "10", CG: "22", DL: "07", GJ: "24",
        HR: "06", HP: "02", JK: "01", JH: "20", KA: "29", KL: "32", MP: "23",
        MH: "27", MN: "14", ML: "17", MZ: "15", NL: "13", OD: "21", PB: "03",
        RJ: "08", SK: "11", TN: "33", TS: "36", TR: "16", UP: "09", UK: "05", WB: "19",
    };

    const filteredOrders = responseData.filter(order => {
        const isB2B = !!order.billing_address?.company;
        const createdAt = new Date(order.date);
        const isMonthMatch = monthQuery
            ? createdAt.getMonth() === monthMap[monthQuery.toLowerCase()]
            : true;
        const isYearMatch = yearQuery
            ? createdAt.getFullYear() === yearQuery
            : true;

        const isTypeMatch =
            orderType === "b2b" ? isB2B :
                orderType === "b2c" ? !isB2B :
                    true;

        return isTypeMatch && isMonthMatch && isYearMatch;
    });

    const gstTotalsMap = {};

    filteredOrders.forEach(order => {
        const isB2B = !!order.billing_address?.company;
        const province = order.customer?.default_address?.province || "N/A";
        const provinceCode = order.customer?.default_address?.province_code;
        const gstCode = gstStateCodes[provinceCode] || "N/A";

        order.line_items?.forEach(item => {
            const gst = item.gst?.toString() || "10";
            const price = parseFloat(item.price) || 0;
            const quantity = parseFloat(item.current_quantity) || 1;
            const cess = parseFloat(item.cess) || 0;
            const gstPercent = parseFloat(item.gst) || 0;
            const totalTax = gstPercent + cess;

            const taxable = (price / (1 + totalTax / 100)) * quantity;
            const igstAmount = (price - (price / (1 + totalTax / 100))) * quantity;
            const cgstRate = gstPercent / 2;
            const cgstAmount = (cgstRate / 100) * taxable;
            const sgstAmount = (cgstRate / 100) * taxable;
            const cessAmount = (cess / 100) * taxable;

            const key = isB2B
                ? `${province}-${gstCode}-${gst}`
                : `${gst}`;

            if (!gstTotalsMap[key]) {
                gstTotalsMap[key] = {
                    province: isB2B ? province : undefined,
                    gst_code: isB2B ? gstCode : undefined,
                    gst,
                    total_price: 0,
                    total_taxable_amount: 0,
                    igst_amount: 0,
                    cgst_amount: 0,
                    sgst_amount: 0,
                    cess_amount: 0
                };
            }

            gstTotalsMap[key].total_price += price * quantity;
            gstTotalsMap[key].total_taxable_amount += taxable;
            gstTotalsMap[key].igst_amount += igstAmount;
            gstTotalsMap[key].cgst_amount += cgstAmount;
            gstTotalsMap[key].sgst_amount += sgstAmount;
            gstTotalsMap[key].cess_amount += cessAmount;
        });
    });

    const gstMappedOrders = Object.values(gstTotalsMap).map(entry => ({
        ...entry,
        total_price: entry.total_price.toFixed(2),
        total_taxable_amount: entry.total_taxable_amount.toFixed(2),
        igst_amount: entry.igst_amount.toFixed(2),
        cgst_amount: entry.cgst_amount.toFixed(2),
        sgst_amount: entry.sgst_amount.toFixed(2),
        cess_amount: entry.cess_amount.toFixed(2)
    }));

    // ✅ Step 3: Save to MongoDB
    const newReport = new gstrReport({
        storeName,
        type: orderType,
        month: monthQuery.toLowerCase(),
        year: yearQuery,
        reportData: gstMappedOrders
    });

    await newReport.save();

    res.json(gstMappedOrders);
});

module.exports = router;