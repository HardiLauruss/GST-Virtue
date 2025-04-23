const express = require('express');
const path = require('path');

const router = express.Router();

// Serve standard.html
router.get('/standard', (req, res) => {
    res.sendFile(path.join(__dirname, '../assets/standard.html'));
});

module.exports = router;