const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const incomeController = require('../controllers/incomeController');

// Validation middleware
const validateIncome = [
  body('clientName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Client name must be between 2 and 100 characters')
    .escape(),
  body('amount')
    .isFloat({ gt: 0 })
    .withMessage('Amount must be greater than 0'),
  body('userId')
    .notEmpty()
    .withMessage('User ID is required'),
  body('tdsDeducted')
    .optional()
    .isBoolean()
    .withMessage('TDS deducted must be a boolean'),
  body('gstApplicable')
    .optional()
    .isBoolean()
    .withMessage('GST applicable must be a boolean'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters')
    .escape()
];

// POST /api/income/addIncome
router.post('/addIncome', validateIncome, incomeController.addIncome);

// GET /api/income/:userId
router.get('/:userId', incomeController.getIncome);

// PUT /api/income/:id
router.put('/:id', incomeController.updateIncome);

// DELETE /api/income/:id
router.delete('/:id', incomeController.deleteIncome);

// GET /api/income/summary/:userId
router.get('/summary/:userId', incomeController.getIncomeSummary);

module.exports = router;
