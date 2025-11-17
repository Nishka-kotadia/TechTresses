const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');

// POST /api/invoice/generateInvoice
router.post('/generateInvoice', invoiceController.generateInvoice);

// POST /api/invoice/preview
router.post('/preview', invoiceController.getInvoicePreview);

// POST /api/invoice/calculate
router.post('/calculate', invoiceController.calculateInvoiceAmounts);

// GET /api/invoice/templates
router.get('/templates', invoiceController.getInvoiceTemplates);

module.exports = router;
