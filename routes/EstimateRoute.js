const express = require('express');
const router = express.Router();
const Estimate = require('../models/Estimate'); 
// POST /estimates (Create)
router.post('/', async (req, res) => {
    try {
      const {
        Estimatenum,
        estDate,
        ExpiryDate,
        supplyDate,
        Estimateprefix,
        Customer,
        totalTax,
        total,
        Status,
        TransportModel,
        selectedProduct,
        rate,
        cgstAmount, sgstAmount
      } = req.body;

      const newEstimate = new Estimate({
        Estimatenum: Estimatenum,
        estDate: estDate,
        Estimateprefix: Estimateprefix,
        supplyDate: supplyDate,
        ExpiryDate: ExpiryDate,
        Customer: Customer,
        totalTax: totalTax,
        total: total,
        Status: Status,
        TransportModel: TransportModel,
        selectedProduct,
        rate,
        cgstAmount, 
        sgstAmount
      });
  
      await newEstimate.save(); // Save the estimate to MongoDB
      res.status(201).json(newEstimate);
  
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });
  
  // GET /estimates (Read All)
  router.get('/', async (req, res) => {
    try {
      const estimates = await Estimate.find(); // Retrieve all estimates
      res.json(estimates);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });
  
  // GET /estimates/:id (Read One)
  router.get('/:id', async (req, res) => {
    try {
      const estimate = await Estimate.findById(req.params.id);
  
      if (!estimate) {
        return res.status(404).json({ message: 'Estimate not found' });
      }
  
      res.json(estimate);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {  // Check for invalid ObjectId format
        return res.status(404).json({ message: 'Estimate not found' });
      }
      res.status(500).send('Server Error');
    }
  });
  
  // PUT /estimates/:id (Update)
  router.put('/:id', async (req, res) => {
    try {
      const { Estimatenum, estDate, ExpiryDate, Customer, totalTax, total, Status } = req.body;
  
      const estimate = await Estimate.findById(req.params.id);
  
      if (!estimate) {
        return res.status(404).json({ message: 'Estimate not found' });
      }
  
      // Update the estimate fields
      estimate.Estimatenum = Estimatenum || estimate.Estimatenum;
      estimate.estDate = estDate || estimate.estDate;
      estimate.ExpiryDate = ExpiryDate || estimate.ExpiryDate;
      estimate.Customer = Customer || estimate.Customer;
      estimate.totalTax = totalTax || estimate.totalTax;
      estimate.total = total || estimate.total;
      estimate.Status = Status || estimate.Status;
      estimate.updated_at = Date.now();
  
      await estimate.save();
  
      res.json(estimate);
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Estimate not found' });
      }
      res.status(500).send('Server Error');
    }
  });
  
  // DELETE /estimates/:id (Delete)
  router.delete('/:id', async (req, res) => {
    try {
      const estimate = await Estimate.findById(req.params.id);
  
      if (!estimate) {
        return res.status(404).json({ message: 'Estimate not found' });
      }
  
      await estimate.deleteOne(); // Use deleteOne() with Mongoose
  
      res.json({ message: 'Estimate deleted' });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Estimate not found' });
      }
      res.status(500).send('Server Error');
    }
  });
  

module.exports = router;