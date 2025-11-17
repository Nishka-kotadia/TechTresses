const express = require('express');
const router = express.Router();
const taxController = require('../controllers/taxController');

// GET /api/tax/calculateTax?userId=...
router.get('/calculateTax', taxController.calculateTax);

// POST /api/tax/getDeductions
router.post('/getDeductions', taxController.getDeductions);

// GET /api/tax/nextDueDate?userId=...
router.get('/nextDueDate', taxController.getNextDueDate);

// GET /api/tax/regimeComparison?income=...
router.get('/regimeComparison', taxController.getTaxRegimeComparison);

// GET /api/tax/advanceTax?userId=...&estimatedIncome=...
router.get('/advanceTax', taxController.getAdvanceTax);

module.exports = router;
