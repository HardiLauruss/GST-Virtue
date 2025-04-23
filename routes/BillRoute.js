const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const axios = require('axios');
const moment = require('moment');


// Middleware to verify required headers
const verifyHeaders = (req, res, next) => {
    const apiVersion = req.headers['api-version'];
    const storeName = req.headers['store-name'];
    const accessToken = req.headers['access-token'];
  
    next();
};

// Apply the verifyHeaders middleware to all routes in this router
router.use(verifyHeaders);

//code for report center bill purchase summarry     
router.get('/tax-calculations', async (req, res) => {
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

      const { startDate, endDate } = req.query; // Expecting 'startDate' and 'endDate' as query params

      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Both startDate and endDate are required." });
      }
    
      // Convert to date format (removing time part)
      const start = moment(startDate).startOf('day').toDate();
      const end = moment(endDate).endOf('day').toDate();
    
      try {
        // Fetch bills within the date range (based on billDate or dueDate)
        const bills = await Bill.find({
          $or: [
            { billDate: { $gte: start, $lte: end } },
            { dueDate: { $gte: start, $lte: end } }
          ]
        });
    
        let totalPrice = 0;
        let totalCGST = 0;
        let totalSGST = 0;
        let totalIGST = 0;
        let totalCESS = 0;
    
        // Fetch product details for each bill (assuming productId is in the bill data)
        const billsWithDetails = await Promise.all(bills.map(async (bill) => {
          const productDetails = await axios.get(`http://localhost:3001/api/products/${bill.productId}`, {
            headers: {
                "access-token": accessToken,
                "Content-Type": "application/json",
                "store-name": storeName,
                "api-version": apiVersion,
            }
          });
    
          const product = productDetails.data;
          const price = parseFloat(product.price) || 0;
          const gstRate = parseFloat(product.gst) || 0;
          const cessRate = parseFloat(product.cess) || 0;
    
          // Tax calculation
          const cessAmount = (price * cessRate) / 100;
          const cgstAmount = (price * gstRate) / 200;
          const sgstAmount = (price * gstRate) / 200;
          const igstAmount = cgstAmount + sgstAmount;
    
          totalPrice += price;
          totalCGST += cgstAmount;
          totalSGST += sgstAmount;
          totalIGST += igstAmount;
          totalCESS += cessAmount;
    
          // Return the bill with necessary details and calculations
          return {
            ...bill.toObject(),
            productDetails: {
              hsn: product.hsn,
              gst: product.gst,
              cess: product.cess,
              price: product.price,
              cgstAmount,
              sgstAmount,
              igstAmount,
              cessAmount
            }
          };
        }));
    
        // Check if only one bill is found
    if (billsWithDetails.length === 1) {
        const singleBill = billsWithDetails[0];
        return res.json({
          totals: {
            totalPrice: singleBill.productDetails.price,
            totalCGST: singleBill.productDetails.cgstAmount,
            totalSGST: singleBill.productDetails.sgstAmount,
            totalIGST: singleBill.productDetails.igstAmount,
            totalCESS: singleBill.productDetails.cessAmount,
          },
          bills: [singleBill], // Return the single bill in the array
        });
    }else{
         // If multiple bills are found, return the total sum of all
      return res.json({
        totals: {
          totalPrice,
          totalCGST,
          totalSGST,
          totalIGST,
          totalCESS
        },
        bills: billsWithDetails,
      });
    }
        
      } catch (error) {
        console.error('Error fetching bills:', error);
        return res.status(500).json({ message: 'Error fetching bills.' });
      }
});


// Get all bills
router.get('/', async (req, res) => {
    try {
        const bills = await Bill.find();
        res.json(bills);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create a new bill
router.post('/', async (req, res) => {
    const bill = new Bill({
        productId: req.body.productId,
        billNumber: req.body.billNumber,
        payeeVendor: req.body.payeeVendor,
        billDate: req.body.billDate,
        dueDate: req.body.dueDate,
        totalTax: req.body.totalTax,
        total: req.body.total,
        totalShippingCharge: req.body.totalShippingCharge, 
        paymentTerms: req.body.paymentTerms,
        rate: req.body.rate,
        selectedProduct: req.body.selectedProduct,
        cgstAmount: req.body.cgstAmount,
        sgstAmount: req.body.sgstAmount,
        paymentDate : req.body.paymentDate,
    });

    try {
        const newBill = await bill.save();
        res.status(201).json(newBill);
    } catch (err) {
        console.error('Error creating bill:', err);
        res.status(400).json({ message: err.message });
    }
});

// Get one bill
router.get('/:id', getBill, (req, res) => {
    res.json(res.bill);
});

// Update a bill
router.put('/:id', getBill, async (req, res) => {
    if (req.body.billNumber != null) {
        res.bill.billNumber = req.body.billNumber;
    }
    if (req.body.payeeVendor != null) {
        res.bill.payeeVendor = req.body.payeeVendor;
    }
    if (req.body.billDate != null) {
        res.bill.billDate = req.body.billDate;
    }
    if (req.body.dueDate != null) {
        res.bill.dueDate = req.body.dueDate;
    }
    if (req.body.totalTax != null) {
        res.bill.totalTax = req.body.totalTax;
    }
    if (req.body.total != null) {
        res.bill.total = req.body.total;
    }
    if (req.body.paymentTerms != null) {
        res.bill.paymentTerms = req.body.paymentTerms;
    }

    try {
        const updatedBill = await res.bill.save();
        res.json(updatedBill);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a bill
router.delete('/:id', getBill, async (req, res) => {
    try {
        if (!res.bill) {
          return res.status(404).json({ message: 'bill not found' });
        }
        await res.bill.deleteOne(); // Mongoose syntax to delete the document
        res.json({ message: 'Deleted Bill' });
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
});

async function getBill(req, res, next) {
    let bill;
    try {
        bill = await Bill.findById(req.params.id);
        if (bill == null) {
            return res.status(404).json({ message: 'Cannot find bill' });
        }
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }

    res.bill = bill;
    next();
}

module.exports = router;