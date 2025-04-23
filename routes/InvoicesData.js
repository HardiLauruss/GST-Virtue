const express = require('express');
const router = express.Router();
const invoiceData = require('../models/invoiceData'); // Make sure the path is correct

// Middleware to verify required headers
const verifyHeaders = (req, res, next) => {
    const apiVersion = req.headers['api-version'];
    const storeName = req.headers['store-name'];
    const accessToken = req.headers['access-token'];
    next();
};

// Apply verifyHeaders middleware to all routes in the router
router.use(verifyHeaders);

// GET all invoices (For Postman - Shows All Fields)
router.get("/full", async (req, res) => {
    try {
        const invoices = await invoiceData.find(); // Fetch everything
        res.json(invoices);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET all invoices (For Frontend - Hides HSN, GST, CESS, Shipping Charge)
router.get("/", async (req, res) => {
    try {
        const invoices = await invoiceData.find().select("-hsn -gst -cess -shippingCharge");
        res.json(invoices);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// for offline report 
router.get('/summary', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ message: "Start date and end date are required" });
        }

        const parseDate = (dateStr) => {
            const [day, month, year] = dateStr.split('/').map(Number);
            return new Date(year, month - 1, day); 
        };

        const start = parseDate(startDate);
        const end = parseDate(endDate);

        let orders = await invoiceData.find();
        orders = orders.filter(order => {
            if (!order.invoiceDate) return false;
            const orderDate = parseDate(order.invoiceDate);
            return orderDate >= start && orderDate <= end;
        });

        if (orders.length === 0) {
            return res.json({ summary: null, orders: [] });
        }

        let totalSubtotalPrice = 0;
        let totalCess = 0;
        let totalCGST = 0;
        let totalSGST = 0;
        let totalIGST = 0;
        let totalShipping = 0;

        // ✅ If only one order, return its values directly
        if (orders.length === 1) {
            const singleOrder = orders[0];

            return res.json({
                summary: {
                    totalOrders: 1,
                    totalSubtotalPrice: singleOrder.total || 0,
                    totalCess: (singleOrder.rate * parseFloat(singleOrder.cess || 0)) / 100,
                    totalCGST: (singleOrder.rate * parseFloat(singleOrder.gst || 0)) / 200,
                    totalSGST: (singleOrder.rate * parseFloat(singleOrder.gst || 0)) / 200,
                    totalIGST: (singleOrder.rate * parseFloat(singleOrder.gst || 0)) / 100,
                    totalShipping: parseFloat(singleOrder.shippingCharge || 0),
                },
                orders: [singleOrder],
            });
        }

        // ✅ If multiple orders, calculate total sums
        orders.forEach(order => {
            const cessAmount = (order.rate * parseFloat(order.cess || 0)) / 100;
            const cgstAmount = (order.rate * parseFloat(order.gst || 0)) / 200;
            const sgstAmount = (order.rate * parseFloat(order.gst || 0)) / 200;
            const igstAmount = cgstAmount + sgstAmount;

            totalSubtotalPrice += order.total || 0;
            totalCess += cessAmount;
            totalCGST += cgstAmount;
            totalSGST += sgstAmount;
            totalIGST += igstAmount;
            totalShipping += parseFloat(order.shippingCharge || 0);
        });

        res.json({
            summary: {
                totalOrders: orders.length,
                totalSubtotalPrice: Math.round(totalSubtotalPrice),
                totalCess: Math.round(totalCess),
                totalCGST: Math.round(totalCGST),
                totalSGST: Math.round(totalSGST),
                totalIGST: Math.round(totalIGST),
                totalShipping: Math.round(totalShipping),
            },
            orders,
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET a specific invoice by ID (For Postman - Shows All Fields)
router.get("/full/:id", async (req, res) => {
    try {
        const invoice = await invoiceData.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }
        res.json(invoice);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// GET a specific invoice by ID (For Frontend - Hides HSN, GST, CESS, Shipping Charge)
router.get("/:id", async (req, res) => {
    try {
        const invoice = await invoiceData.findById(req.params.id).select("-hsn -gst -cess -shippingCharge");
        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }
        res.json(invoice);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// POST a new invoice
router.post("/", async (req, res) => {
    const invoice = new invoiceData({
        invoiceNumber: req.body.invoiceNumber,
        customerName: req.body.customerName,
        invoiceDate: req.body.invoiceDate,
        dateOfSupply: req.body.dateOfSupply,
        totalTax: req.body.totalTax,
        Status: req.body.Status,
        total: req.body.total,
        hsn: req.body.hsn, // Added
        gst: req.body.gst, // Added
        cess: req.body.cess, // Added
        shippingCharge: req.body.shippingCharge, 
        rate: req.body.rate 
    });

    try {
        const newInvoice = await invoice.save();
        res.status(201).json(newInvoice);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});



// PUT (update) an existing invoice by ID
router.put('/:id', async (req, res) => {
    try {
        const invoice = await invoiceData.findById(req.params.id); // Use invoiceData here
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        invoice.invoiceNumber = req.body.invoiceNumber || invoice.invoiceNumber; // Use existing value if not provided
        invoice.customerName = req.body.customerName || invoice.customerName;
        invoice.invoiceDate = req.body.invoiceDate || invoice.invoiceDate;
        invoice.dateOfSupply = req.body.dateOfSupply || invoice.dateOfSupply;
        invoice.totalTax = req.body.totalTax || invoice.totalTax;
        invoice.Status = req.body.Status || invoice.Status;
        invoice.total = req.body.total || invoice.total;

        const updatedInvoice = await invoice.save();
        res.json(updatedInvoice);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE an invoice by ID
router.delete('/:id', async (req, res) => {
    try {
        const invoice = await invoiceData.findById(req.params.id); // Use invoiceData here
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        await invoice.deleteOne();
        res.json({ message: 'Invoice deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;