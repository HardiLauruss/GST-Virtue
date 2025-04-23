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
        console.error("Missing Headers:", { apiVersion, storeName, accessToken });
        return res.status(400).json({
            message: "Missing required headers",
            receivedHeaders: req.headers,
        });
    }

    const url = `http://localhost:3001/api/orders`;

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

        const responseData = await response.json();
        if (!responseData || responseData.length === 0) {
            return res.status(404).json({ message: "No orders found for the given date range" });
        }

        const monthMap = {
            january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
            july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
        };

        const monthIndex = monthQuery ? monthMap[monthQuery.toLowerCase()] : null;

        // Filter orders by month and year
        const filteredOrders = responseData.filter(order => {
            const createdAt = new Date(order.date);
            const isMonthMatch = monthIndex !== null ? createdAt.getMonth() === monthIndex : true;
            const isYearMatch = yearQuery ? createdAt.getFullYear() === yearQuery : true;
            return isMonthMatch && isYearMatch;
        });

        // Invoices for outward supply
        const invoiceOrders = filteredOrders.filter(order =>
            order.financial_status !== 'refunded' && order.financial_status !== 'partially_refunded'
        );

        const invoiceNumbers = invoiceOrders.map(order => order.invoice_number).sort();

        const invoiceSummary = {
            "Nature of Document": "Invoices for outward supply",
            "Sr.No. From": invoiceNumbers[0] || "",
            "Sr.No. To": invoiceNumbers[invoiceNumbers.length - 1] || "",
            "Total Number": invoiceNumbers.length,
            "Cancelled": invoiceOrders.filter(order =>
                order.cancelled_at !== null || order.financial_status === 'voided'
            ).length
        };

        // Credit Notes (Refunded Orders)
        const creditNoteOrders = filteredOrders.filter(order =>
            order.financial_status === 'refunded' || order.financial_status === 'partially_refunded'
        );

        const creditNoteNumbers = creditNoteOrders.map(order => order.invoice_number).sort();

        const creditNoteSummary = {
            "Nature of Document": "Credit Notes",
            "Sr.No. From": creditNoteNumbers[0] || "",
            "Sr.No. To": creditNoteNumbers[creditNoteNumbers.length - 1] || "",
            "Total Number": creditNoteNumbers.length,
            "Cancelled": 0 // assuming credit notes can't be cancelled via Shopify
        };

        // Purchase Bills – Static for now
        const purchaseSummary = {
            "Nature of Document": "Purchase Bills",
            "Sr.No. From": "",
            "Sr.No. To": "",
            "Total Number": 0,
            "Cancelled": 0
        };

        const documentSummary = [
            invoiceSummary,
            purchaseSummary,
            creditNoteSummary
        ];

        return res.json({ document_summary: documentSummary });

    } catch (error) {
        console.error("Error fetching or processing orders:", error);
        return res.status(500).json({ message: "Internal server error", error });
    }
});

module.exports = router;