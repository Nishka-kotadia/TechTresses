const Income = require('../models/income');
const User = require('../models/user');

class TaxService {
  // Calculate income tax using NEW REGIME slabs (FY 2024-25)
  calculateIncomeTax(totalIncome) {
    let tax = 0;
    
    // New Regime Slabs:
    // 0 - 2,50,000: 0%
    // 2,50,001 - 5,00,000: 5%
    // 5,00,001 - 7,50,000: 10%
    // 7,50,001 - 10,00,000: 15%
    // 10,00,001 - 12,50,000: 20%
    // 12,50,001 - 15,00,000: 25%
    // Above 15,00,000: 30%
    
    if (totalIncome <= 250000) {
      tax = 0;
    } else if (totalIncome <= 500000) {
      tax = (totalIncome - 250000) * 0.05;
    } else if (totalIncome <= 750000) {
      tax = 12500 + (totalIncome - 500000) * 0.10;
    } else if (totalIncome <= 1000000) {
      tax = 37500 + (totalIncome - 750000) * 0.15;
    } else if (totalIncome <= 1250000) {
      tax = 75000 + (totalIncome - 1000000) * 0.20;
    } else if (totalIncome <= 1500000) {
      tax = 125000 + (totalIncome - 1250000) * 0.25;
    } else {
      tax = 187500 + (totalIncome - 1500000) * 0.30;
    }
    
    return Math.round(tax);
  }

  // Apply TDS at 10%
  applyTDS(amount) {
    return Math.round(amount * 0.10);
  }

  // Check GST threshold (20 lakhs)
  checkGSTThreshold(totalIncome) {
    return totalIncome > 2000000;
  }

  // Calculate advance tax due based on current date
  getAdvanceTaxDue(estimatedTax) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // Months are 0-indexed
    
    // Advance Tax Schedule:
    // By June 15: 15% of estimated tax
    // By September 15: 45% of estimated tax
    // By December 15: 75% of estimated tax
    // By March 15: 100% of estimated tax
    
    let percentageDue = 0;
    let nextDueDate = '';
    
    if (currentMonth < 6) {
      percentageDue = 0;
      nextDueDate = `June 15, ${currentYear}`;
    } else if (currentMonth < 9) {
      percentageDue = 0.15;
      nextDueDate = `September 15, ${currentYear}`;
    } else if (currentMonth < 12) {
      percentageDue = 0.45;
      nextDueDate = `December 15, ${currentYear}`;
    } else {
      percentageDue = 0.75;
      nextDueDate = `March 15, ${currentYear + 1}`;
    }
    
    return {
      amountDue: Math.round(estimatedTax * percentageDue),
      nextDueDate,
      percentageDue: percentageDue * 100
    };
  }

  // Calculate deductions based on expenses and 80C options
  calculateDeductions(income, expenses) {
    const deductions = [];
    let totalDeductions = 0;

    // 80C deductions (max 1.5L)
    const max80C = 150000;
    let current80C = 0;

    // PPF (Public Provident Fund)
    if (income > 300000) {
      const ppfAmount = Math.min(50000, max80C - current80C);
      deductions.push({
        section: '80C - PPF',
        amount: ppfAmount,
        description: 'Public Provident Fund contribution'
      });
      current80C += ppfAmount;
    }

    // ELSS (Equity Linked Savings Scheme)
    if (income > 400000 && current80C < max80C) {
      const elssAmount = Math.min(60000, max80C - current80C);
      deductions.push({
        section: '80C - ELSS',
        amount: elssAmount,
        description: 'Equity Linked Savings Scheme'
      });
      current80C += elssAmount;
    }

    // Life Insurance Premium
    if (income > 500000 && current80C < max80C) {
      const insuranceAmount = Math.min(40000, max80C - current80C);
      deductions.push({
        section: '80C - Life Insurance',
        amount: insuranceAmount,
        description: 'Life insurance premium'
      });
      current80C += insuranceAmount;
    }

    totalDeductions += current80C;

    // Business expense deductions
    if (expenses) {
      Object.entries(expenses).forEach(([category, amount]) => {
        if (amount > 0) {
          deductions.push({
            section: 'Business Expense',
            amount: amount,
            description: `${category} - business expense`
          });
          totalDeductions += amount;
        }
      });
    }

    // Home office allowance (20-30% of rent)
    const homeOfficeAllowance = Math.round(income * 0.25);
    deductions.push({
      section: 'Home Office',
      amount: homeOfficeAllowance,
      description: 'Home office allowance (25% of income)'
    });
    totalDeductions += homeOfficeAllowance;

    // Calculate possible tax savings
    const taxWithoutDeductions = this.calculateIncomeTax(income);
    const taxableIncome = Math.max(0, income - totalDeductions);
    const taxWithDeductions = this.calculateIncomeTax(taxableIncome);
    const possibleSavings = taxWithoutDeductions - taxWithDeductions;

    return {
      recommendedDeductions: deductions,
      totalDeductions,
      possibleSavings,
      taxableIncome,
      taxWithDeductions
    };
  }

  // Get next due dates for advance tax and GST
  getNextDueDate(userId) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    // Calculate next advance tax due date
    let nextAdvanceTaxDue = '';
    if (currentMonth < 6) {
      nextAdvanceTaxDue = `June 15, ${currentYear}`;
    } else if (currentMonth < 9) {
      nextAdvanceTaxDue = `September 15, ${currentYear}`;
    } else if (currentMonth < 12) {
      nextAdvanceTaxDue = `December 15, ${currentYear}`;
    } else {
      nextAdvanceTaxDue = `March 15, ${currentYear + 1}`;
    }

    // Calculate next GST due date (if user is GST registered)
    let nextGSTDue = null;
    // GST is typically filed monthly (18th of next month) or quarterly
    // For simplicity, we'll use quarterly filing
    const gstQuarters = [
      { end: 'April 18', due: 'April 18' },
      { end: 'July 18', due: 'July 18' },
      { end: 'October 18', due: 'October 18' },
      { end: 'January 18', due: 'January 18' }
    ];

    return {
      nextAdvanceTaxDue,
      nextGSTDue
    };
  }

  // Get complete tax calculation for a user
  async calculateTax(userId) {
    try {
      // Get user details
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get all income for the user
      const incomes = await Income.find({ userId });
      
      // Calculate total income
      const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
      
      // Calculate TDS collected
      const tdsCollected = incomes
        .filter(income => income.tdsDeducted)
        .reduce((sum, income) => sum + this.applyTDS(income.amount), 0);
      
      // Check if GST is required
      const gstRequired = user.gstRegistered && this.checkGSTThreshold(totalIncome);
      
      // Calculate income tax
      const incomeTax = this.calculateIncomeTax(totalIncome);
      
      // Calculate advance tax adjustments
      const advanceTaxInfo = this.getAdvanceTaxDue(incomeTax);
      
      // Final tax payable (income tax - TDS already deducted)
      const finalTaxPayable = Math.max(0, incomeTax - tdsCollected);

      return {
        totalIncome,
        gstRequired,
        tdsCollected,
        incomeTax,
        finalTaxPayable,
        advanceTaxDue: advanceTaxInfo.amountDue,
        nextAdvanceTaxDue: advanceTaxInfo.nextDueDate,
        incomeBreakdown: incomes.map(income => ({
          clientName: income.clientName,
          amount: income.amount,
          date: income.date,
          tdsDeducted: income.tdsDeducted,
          gstApplicable: income.gstApplicable
        }))
      };
    } catch (error) {
      throw new Error(`Tax calculation failed: ${error.message}`);
    }
  }
}

module.exports = new TaxService();
