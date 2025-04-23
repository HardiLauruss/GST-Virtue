const express = require('express');
const router = express.Router();
const Payee = require('../models/Payee');

// Middleware to verify required headers
const verifyHeaders = (req, res, next) => {
    const apiVersion = req.headers['api-version'];
    const storeName = req.headers['store-name'];
    const accessToken = req.headers['access-token'];
  
    next();
  };
  
  // Apply the verifyHeaders middleware to all routes in this router
  router.use(verifyHeaders);
  
  // Get all payees
  router.get('/', async (req, res) => {
    try {
      const payees = await Payee.find();
      res.json(payees);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  
  // Create a new payee
  router.post('/', async (req, res) => {
    console.log("Received request body:", req.body);
    
    const payee = new Payee({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      company: req.body.company,
      phone: req.body.phone,
      mobile: req.body.mobile,
      displayName: req.body.displayName,
      street: req.body.street,
      city: req.body.city,
      state: req.body.state,
      pincode: req.body.pincode,
      gstIn: req.body.gstIn,
    });
  
    try {
      const newPayee = await payee.save();
      res.status(201).json(newPayee);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });
  
  // Get one payee
  router.get('/:id', getPayee, (req, res) => {
    res.json(res.payee);
  });
  
  // Update a payee
  router.put('/:id', getPayee, async (req, res) => {
    if (req.body.firstName != null) {
      res.payee.firstName = req.body.firstName;
    }
    if (req.body.lastName != null) {
      res.payee.lastName = req.body.lastName;
    }
    if (req.body.email != null) {
      res.payee.email = req.body.email;
    }
    if (req.body.company != null) {
      res.payee.company = req.body.company;
    }
      if (req.body.phone != null) {
      res.payee.phone = req.body.phone;
    }
      if (req.body.mobile != null) {
      res.payee.mobile = req.body.mobile;
    }
      if (req.body.displayName != null) {
      res.payee.displayName = req.body.displayName;
    }
      if (req.body.street != null) {
      res.payee.street = req.body.street;
    }
      if (req.body.city != null) {
      res.payee.city = req.body.city;
    }
      if (req.body.state != null) {
      res.payee.state = req.body.state;
    }
      if (req.body.pincode != null) {
      res.payee.pincode = req.body.pincode;
    }
      if (req.body.gstIn != null) {
      res.payee.gstIn = req.body.gstIn;
    }
  
    try {
      const updatedPayee = await res.payee.save();
      res.json(updatedPayee);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });
  
  // Delete a payee
  router.delete('/:id', getPayee, async (req, res) => {
    try {
        if (!res.payee) {
          return res.status(404).json({ message: 'Payee not found' });
        }
        await res.payee.deleteOne(); // Mongoose syntax to delete the document
        res.json({ message: 'Deleted Payee' });
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
  });
  
  // Middleware function for getting payee object by ID
  async function getPayee(req, res, next) {
    let payee;
    try {
      payee = await Payee.findById(req.params.id);
      if (payee == null) {
        return res.status(404).json({ message: 'Cannot find payee' });
      }
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  
    res.payee = payee;
    next();
  }
module.exports = router;