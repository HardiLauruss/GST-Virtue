const express = require('express');
const path = require('path');
const HSNSummary = require("../models/HsnPurchaseSummary");

const router = express.Router();

router.get('/', async (req, res) => {
    const apiVersion = req.headers["api-version"];
    const storeName = req.headers["store-name"];
    const accessToken = req.headers["access-token"];
    const monthQuery = req.query.month;
    const yearQuery = req.query.year ? parseInt(req.query.year) : null;

    const cacheKey = `${monthQuery}-${yearQuery}`;
        if (HSNSummary[cacheKey]) {
            return res.json(HSNSummary[cacheKey]);
        }
   
    if (!apiVersion || !storeName || !accessToken) {
        return res.status(400).json({
            message: "Missing required headers",
            receivedHeaders: req.headers,
        });
    }

    const url = `http://localhost:3001/api/bills`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "access-token": accessToken,
                "Content-Type": "application/json",
                "store-name": storeName,
                "api-version": apiVersion,
            },
        });

        const data = await response.json();

        if (!data || data.length === 0) {
            return res.status(404).json({ message: "No purchase data found." });
        }

        // Optionally filter by month and year
        const targetMonth = monthQuery ? monthQuery.toLowerCase() : null;
        const monthMap = {
            january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
            july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
        };
        const monthIndex = monthQuery ? monthMap[monthQuery.toLowerCase()] : null;
      
        const filtered = data.filter(entry => {
            const date = new Date(entry.billDate);
            const matchMonth = monthIndex !== null ? date.getMonth() === monthIndex : true;
            const matchYear = yearQuery ? date.getFullYear() === yearQuery : true;
            
            return matchMonth && matchYear;
        });

        const hsnMap = {};

        filtered.forEach(entry => {
            const hsn = entry.hsn || entry.hsn_code || "0";
            const quantity = parseFloat(entry.quantity || 1);
            const rate = parseFloat(entry.gst_rate || entry.gst || 0);
            const totalValue = parseFloat(entry.total_value || entry.total || 0);
            const taxable = parseFloat(entry.taxable_value || entry.taxable || 0);
            const igst = parseFloat(entry.igst || 0);
            const cgst = parseFloat(entry.cgst || 0);
            const sgst = parseFloat(entry.sgst || 0);
            const cess = parseFloat(entry.cess || 0);

            if (!hsnMap[hsn]) {
                hsnMap[hsn] = {
                    hsn,
                    total_quantity: 0,
                    total_value: 0,
                    gst_rate: rate,
                    taxable_value: 0,
                    igst: 0,
                    cgst: 0,
                    sgst: 0,
                    cess: 0
                };
            }

            hsnMap[hsn].total_quantity += quantity;
            hsnMap[hsn].total_value += totalValue;
            hsnMap[hsn].taxable_value += taxable;
            hsnMap[hsn].igst += igst;
            hsnMap[hsn].cgst += cgst;
            hsnMap[hsn].sgst += sgst;
            hsnMap[hsn].cess += cess;
        });

        const result = Object.values(hsnMap).map(hsn => ({
            HSN: hsn.hsn,
            "Total Qty": hsn.total_quantity,
            "Total Value (Rs.)": hsn.total_value.toFixed(2),
            "Rate (%)": hsn.gst_rate,
            "Taxable value (Rs.)": hsn.taxable_value.toFixed(2),
            "Integrated Tax (Rs.)": hsn.igst.toFixed(2),
            "Central Tax (Rs.)": hsn.cgst.toFixed(2),
            "State/UT Tax (Rs.)": hsn.sgst.toFixed(2),
            "CESS (Rs.)": hsn.cess.toFixed(2),
        }));

        HSNSummary[cacheKey] = result;
        return res.json({ hsn_summary: result });

    } catch (err) {
        console.error("Error fetching or processing HSN summary:", err);
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
});


router.post("/", async (req, res) => {
    try {
        const { rawMonth, year } = req.body;
    
        // Check if this month-year combo already exists
        const exists = await HSNSummary.findOne({ rawMonth, year });
    
        if (!exists) {
        const saved = await HSNSummary.create(req.body);
        return res.status(201).json(saved);
        }
    
        res.status(200).json({ message: 'Already saved' });
    } catch (error) {
        res.status(500).json({ error: 'Server error while saving report' });
    }
});
  
router.get("/saved", async (req, res) => {
    try {
        const reports = await HSNSummary.find();
        res.json(reports);
    } catch (error) {
        res.status(500).json({ error: 'Server error while fetching reports' });
    }
});


module.exports = router;