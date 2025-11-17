const express = require('express');
const router = express.Router();
const incomeController = require('../controllers/incomeController');

// POST /api/income/addIncome
router.post('/addIncome', incomeController.addIncome);

// GET /api/income/:userId
router.get('/:userId', incomeController.getIncome);

// PUT /api/income/:id
router.put('/:id', incomeController.updateIncome);

// DELETE /api/income/:id
router.delete('/:id', incomeController.deleteIncome);

// GET /api/income/summary/:userId
router.get('/summary/:userId', incomeController.getIncomeSummary);

module.exports = router;
