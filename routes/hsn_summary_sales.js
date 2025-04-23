const express = require('express');
const path = require('path');
const HSNSavedReport = require('../models/hsnSavedReport');

const router = express.Router();

router.get('/', async (req, res) => {
    const apiVersion = req.headers["api-version"];
    const storeName = req.headers["store-name"];
    const accessToken = req.headers["access-token"];
    const monthQuery = req.query.month;
    const yearQuery = req.query.year ? parseInt(req.query.year) : null;

    const cacheKey = `${monthQuery}-${yearQuery}`;
    if (HSNSavedReport[cacheKey]) {
        return res.json(HSNSavedReport[cacheKey]);
    }

    if (!apiVersion || !storeName || !accessToken) {
        console.error("Missing Headers:", { apiVersion, storeName, accessToken });
        return res.status(400).json({
            message: "Missing required headers",
            receivedHeaders: req.headers,
        });
    }

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
        console.warn("No orders found from Shopify or invalid data.");
        return res.status(404).json({ message: "No orders found for the given date range" });
    }

    const targetMonth = monthQuery ? monthQuery.toLowerCase() : null;
    const monthMap = {
        january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
        july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
    };
    const monthIndex = monthMap[targetMonth];

    const gstStateCodes = {
        AP: "37", AR: "12", AS: "18", BR: "10", CG: "22", DL: "07", GJ: "24",
        HR: "06", HP: "02", JK: "01", JH: "20", KA: "29", KL: "32", MP: "23",
        MH: "27", MN: "14", ML: "17", MZ: "15", NL: "13", OD: "21", PB: "03",
        RJ: "08", SK: "11", TN: "33", TS: "36", TR: "16", UP: "09", UK: "05", WB: "19",
    };

    // Filter orders by type and month
    const filteredOrders = responseData.filter(order => {
        const createdAt = new Date(order.date);
        const isMonthMatch = monthQuery
            ? createdAt.getMonth() === monthMap[monthQuery.toLowerCase()]
            : true;
        const isYearMatch = yearQuery
            ? createdAt.getFullYear() === yearQuery
            : true;

        return isMonthMatch && isYearMatch;
    });

    const hsnTotalsMap = {};

    filteredOrders.forEach(order => {
        const province = order.customer?.default_address?.province || "N/A";
        const provinceCode = order.customer?.default_address?.province_code;
        const gstCode = gstStateCodes[provinceCode] || "N/A";

        order.line_items?.forEach(item => {
            const hsn = item.hsn || "N/A";
            const price = parseFloat(item.price) || 0;
            const quantity = parseFloat(item.current_quantity) || 1;
            const cess = parseFloat(item.cess) || 0;
            const gstPercent = parseFloat(item.gst) || 0;
            const totalTax = gstPercent + cess;

            // Calculate amounts
            const taxable = (price / (1 + totalTax / 100)) * quantity;
            const igstAmount = (price - (price / (1 + totalTax / 100))) * quantity;
            const cgstRate = gstPercent / 2;
            const cgstAmount = (cgstRate / 100) * taxable;
            const sgstAmount = (cgstRate / 100) * taxable;
            const cessAmount = (cess / 100) * taxable;

            // Use HSN as grouping key
            if (!hsnTotalsMap[hsn]) {
                hsnTotalsMap[hsn] = {
                    hsn,
                    total_price: 0,
                    total_taxable_amount: 0,
                    igst_amount: 0,
                    cgst_amount: 0,
                    sgst_amount: 0,
                    cess_amount: 0,
                    total_quantity: 0
                };
            }

            hsnTotalsMap[hsn].total_price += price * quantity;
            hsnTotalsMap[hsn].total_taxable_amount += taxable;
            hsnTotalsMap[hsn].igst_amount += igstAmount;
            hsnTotalsMap[hsn].cgst_amount += cgstAmount;
            hsnTotalsMap[hsn].sgst_amount += sgstAmount;
            hsnTotalsMap[hsn].cess_amount += cessAmount;
            hsnTotalsMap[hsn].total_quantity += quantity;
        });
    });

    const hsnMappedOrders = Object.values(hsnTotalsMap).map(entry => {
        const integratedTax =
            parseFloat(entry.cgst_amount) +
            parseFloat(entry.sgst_amount) +
            parseFloat(entry.cess_amount);

        return {
            ...entry,
            total_price: entry.total_price.toFixed(2),
            total_taxable_amount: entry.total_taxable_amount.toFixed(2),
            igst_amount: entry.igst_amount.toFixed(2),
            cgst_amount: entry.cgst_amount.toFixed(2),
            sgst_amount: entry.sgst_amount.toFixed(2),
            cess_amount: entry.cess_amount.toFixed(2),
            total_quantity: entry.total_quantity || 0,
            integrated_tax: integratedTax.toFixed(2),      // 👉 Integrated Tax (Rs.)
            central_tax: entry.cgst_amount.toFixed(2),      // 👉 Central Tax (Rs.)
            state_ut_tax: entry.sgst_amount.toFixed(2)      // 👉 State/UT Tax (Rs.)
        };
    });

    HSNSavedReport[cacheKey] = hsnMappedOrders;
    res.json(hsnMappedOrders);
});

router.post('/', async (req, res) => {
    try {
      const { rawMonth, year } = req.body;
  
      // Check if this month-year combo already exists
      const exists = await HSNSavedReport.findOne({ rawMonth, year });
  
      if (!exists) {
        const saved = await HSNSavedReport.create(req.body);
        return res.status(201).json(saved);
      }
  
      res.status(200).json({ message: 'Already saved' });
    } catch (error) {
      res.status(500).json({ error: 'Server error while saving report' });
    }
  });

  router.get('/hsn', async (req, res) => {
    try {
      const reports = await HSNSavedReport.find();
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: 'Server error while fetching reports' });
    }
  });

module.exports = router;