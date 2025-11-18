const Income = require('../models/income');
const User = require('../models/user');
const { body, validationResult } = require('express-validator');

class IncomeController {
  // Add new income entry
  async addIncome(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { clientName, amount, tdsDeducted, gstApplicable, notes, userId } = req.body;

      // Additional business logic validation
      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be greater than 0'
        });
      }

      if (clientName.length < 2 || clientName.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Client name must be between 2 and 100 characters'
        });
      }

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Create new income entry
      const income = new Income({
        clientName,
        amount,
        tdsDeducted: tdsDeducted || false,
        gstApplicable: gstApplicable || false,
        notes: notes || '',
        userId
      });

      const savedIncome = await income.save();

      res.status(201).json({
        success: true,
        message: 'Income entry added successfully',
        data: savedIncome
      });

    } catch (error) {
      console.error('Error adding income:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add income entry',
        error: error.message
      });
    }
  }

  // Get all income for a user
  async getIncome(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const incomes = await Income.find({ userId }).sort({ date: -1 });

      res.status(200).json({
        success: true,
        message: 'Income entries retrieved successfully',
        data: incomes,
        count: incomes.length
      });

    } catch (error) {
      console.error('Error getting income:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve income entries',
        error: error.message
      });
    }
  }

  // Update income entry
  async updateIncome(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const income = await Income.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      );

      if (!income) {
        return res.status(404).json({
          success: false,
          message: 'Income entry not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Income entry updated successfully',
        data: income
      });

    } catch (error) {
      console.error('Error updating income:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update income entry',
        error: error.message
      });
    }
  }

  // Delete income entry
  async deleteIncome(req, res) {
    try {
      const { id } = req.params;

      const income = await Income.findByIdAndDelete(id);

      if (!income) {
        return res.status(404).json({
          success: false,
          message: 'Income entry not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Income entry deleted successfully',
        data: income
      });

    } catch (error) {
      console.error('Error deleting income:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete income entry',
        error: error.message
      });
    }
  }

  // Get income summary for a user
  async getIncomeSummary(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const incomes = await Income.find({ userId });

      const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
      const tdsCollected = incomes
        .filter(income => income.tdsDeducted)
        .reduce((sum, income) => sum + (income.amount * 0.10), 0);
      const gstApplicableCount = incomes.filter(income => income.gstApplicable).length;

      const summary = {
        totalIncome,
        totalEntries: incomes.length,
        tdsCollected: Math.round(tdsCollected),
        gstApplicableCount,
        averageIncome: incomes.length > 0 ? Math.round(totalIncome / incomes.length) : 0
      };

      res.status(200).json({
        success: true,
        message: 'Income summary retrieved successfully',
        data: summary
      });

    } catch (error) {
      console.error('Error getting income summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve income summary',
        error: error.message
      });
    }
  }
}

module.exports = new IncomeController();
