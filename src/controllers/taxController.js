const taxService = require('../services/taxService');

class TaxController {
  // Calculate tax for a user
  async calculateTax(req, res) {
    try {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const taxCalculation = await taxService.calculateTax(userId);

      res.status(200).json({
        success: true,
        message: 'Tax calculated successfully',
        data: taxCalculation
      });

    } catch (error) {
      console.error('Error calculating tax:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate tax',
        error: error.message
      });
    }
  }

  // Get deductions suggestions
  async getDeductions(req, res) {
    try {
      const { income, expenses } = req.body;

      if (!income || income <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid income amount is required'
        });
      }

      const deductions = taxService.calculateDeductions(income, expenses || {});

      res.status(200).json({
        success: true,
        message: 'Deductions calculated successfully',
        data: deductions
      });

    } catch (error) {
      console.error('Error calculating deductions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate deductions',
        error: error.message
      });
    }
  }

  // Get next due dates
  async getNextDueDate(req, res) {
    try {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const dueDates = taxService.getNextDueDate(userId);

      res.status(200).json({
        success: true,
        message: 'Due dates retrieved successfully',
        data: dueDates
      });

    } catch (error) {
      console.error('Error getting due dates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve due dates',
        error: error.message
      });
    }
  }

  // Get tax regime comparison
  async getTaxRegimeComparison(req, res) {
    try {
      const { income } = req.query;

      if (!income || income <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid income amount is required'
        });
    }

      // Calculate tax under new regime
      const newRegimeTax = taxService.calculateIncomeTax(parseFloat(income));

      // Calculate tax under old regime (simplified version)
      let oldRegimeTax = 0;
      const incomeNum = parseFloat(income);
      
      // Old regime slabs (with standard deduction of 50,000)
      const taxableIncome = Math.max(0, incomeNum - 50000);
      
      if (taxableIncome <= 250000) {
        oldRegimeTax = 0;
      } else if (taxableIncome <= 500000) {
        oldRegimeTax = (taxableIncome - 250000) * 0.05;
      } else if (taxableIncome <= 1000000) {
        oldRegimeTax = 12500 + (taxableIncome - 500000) * 0.20;
      } else {
        oldRegimeTax = 112500 + (taxableIncome - 1000000) * 0.30;
      }

      // Add cess (4% on tax)
      oldRegimeTax = Math.round(oldRegimeTax * 1.04);

      const comparison = {
        income: incomeNum,
        newRegime: {
          tax: newRegimeTax,
          effectiveRate: ((newRegimeTax / incomeNum) * 100).toFixed(2)
        },
        oldRegime: {
          tax: oldRegimeTax,
          effectiveRate: ((oldRegimeTax / incomeNum) * 100).toFixed(2)
        },
        recommended: newRegimeTax <= oldRegimeTax ? 'New Regime' : 'Old Regime',
        savings: Math.abs(newRegimeTax - oldRegimeTax)
      };

      res.status(200).json({
        success: true,
        message: 'Tax regime comparison completed',
        data: comparison
      });

    } catch (error) {
      console.error('Error comparing tax regimes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to compare tax regimes',
        error: error.message
      });
    }
  }

  // Get advance tax calculation
  async getAdvanceTax(req, res) {
    try {
      const { userId, estimatedIncome } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      let taxAmount;
      if (estimatedIncome) {
        taxAmount = taxService.calculateIncomeTax(parseFloat(estimatedIncome));
      } else {
        // Calculate from actual income
        const taxCalculation = await taxService.calculateTax(userId);
        taxAmount = taxCalculation.incomeTax;
      }

      const advanceTaxInfo = taxService.getAdvanceTaxDue(taxAmount);

      res.status(200).json({
        success: true,
        message: 'Advance tax calculated successfully',
        data: {
          estimatedTax: taxAmount,
          ...advanceTaxInfo
        }
      });

    } catch (error) {
      console.error('Error calculating advance tax:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate advance tax',
        error: error.message
      });
    }
  }
}

module.exports = new TaxController();
