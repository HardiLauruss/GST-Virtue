const express = require('express');
const path = require('path');

const router = express.Router();

router.get('/', async (req, res) => {
    const apiVersion = req.headers["api-version"];
    const storeName = req.headers["store-name"];
    const accessToken = req.headers["access-token"];
    const monthQuery = req.query.month;
    const yearQuery = req.query.year ? parseInt(req.query.year) : null;

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

        const bills = await response.json();

        if (!bills || bills.length === 0) {
            return res.status(404).json({ message: "No bills found." });
        }

        const monthMap = {
            january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
            july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
        };

        const monthIndex = monthQuery ? monthMap[monthQuery.toLowerCase()] : null;

        // Filter bills by billDate
        const filteredBills = bills.filter(bill => {
            const billDate = new Date(bill.billDate);
            const matchesMonth = monthIndex !== null ? billDate.getMonth() === monthIndex : true;
            const matchesYear = yearQuery ? billDate.getFullYear() === yearQuery : true;
            return matchesMonth && matchesYear;
        });

        // Initialize totals
        let totalIGST = 0;
        let totalCGST = 0;
        let totalSGST = 0;
        let totalCESS = 0;

        filteredBills.forEach(bill => {
            totalIGST += parseFloat(bill.igstAmount || 0);
            totalCGST += parseFloat(bill.cgstAmount || 0);
            totalSGST += parseFloat(bill.sgstAmount || 0);
            totalCESS += parseFloat(bill.selectedProduct?.cess || 0);
        });

        const responseData = {
            "details": "All Other ITC",
            "month": monthQuery || "All",
            "year": yearQuery || "All",
            "integrated_tax": totalIGST.toFixed(2),
            "central_tax": totalCGST.toFixed(2),
            "state_ut_tax": totalSGST.toFixed(2),
            "cess": totalCESS.toFixed(2)
        };

        return res.json(responseData);

    } catch (error) {
        console.error("Error fetching bills:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
});

module.exports = router;























































