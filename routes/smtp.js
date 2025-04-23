const express = require('express');
const router = express.Router();
const smtpController = require('../Controllers/smtpController');

router.post('/test-smtp', smtpController.testSmtpConfiguration);

module.exports = router;