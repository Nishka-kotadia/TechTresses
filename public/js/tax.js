/**
 * Tax Calculator Page JavaScript
 * Handles tax calculations, regime comparison, and advance tax
 */

import { 
  formatCurrency, 
  showToast, 
  showLoading, 
  hideLoading,
  getCurrentUserId,
  parseFormData,
  validateForm,
  calculateIndianTax,
  calculateAdvanceTax,
  animateNumber
} from './utils.js';
import { unifiedApi } from './api.js';
import { drawBarChart, drawPieChart } from './charts.js';

/**
 * Tax page state
 */
let taxState = {
  currentCalculation: null,
  userIncome: [],
  isLoading: false,
  currentRegime: 'new'
};

/**
 * Initialize tax page
 */
export async function initTax() {
  try {
    console.log('Initializing tax calculator...');
    showLoading('Loading tax data...');
    
    // Load user data
    await loadUserData();
    
    // Setup form handlers
    setupTaxForm();
    
    // Setup regime comparison
    setupRegimeComparison();
    
    // Load initial calculation
    await performTaxCalculation();
    
    hideLoading();
    showToast('Tax calculator ready', 'success');
    
  } catch (error) {
    hideLoading();
    console.error('Failed to initialize tax page:', error);
    showToast('Failed to load tax calculator. Please try again.', 'error');
  }
}

/**
 * Load user income data
 */
async function loadUserData() {
  const userId = getCurrentUserId();
  
  try {
    taxState.userIncome = await unifiedApi.getIncome(userId);
  } catch (error) {
    console.error('Failed to load user income data:', error);
    taxState.userIncome = [];
  }
}

/**
 * Setup tax form handlers
 */
function setupTaxForm() {
  const form = document.getElementById('taxForm');
  if (!form) return;
  
  // Form submission
  form.addEventListener('submit', handleTaxSubmit);
  
  // Real-time calculation
  const inputs = form.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('input', debounce(handleRealtimeCalculation, 500));
  });
  
  // Regime change
  const regimeInputs = form.querySelectorAll('input[name="regime"]');
  regimeInputs.forEach(input => {
    input.addEventListener('change', handleRegimeChange);
  });
}

/**
 * Setup regime comparison
 */
function setupRegimeComparison() {
  // Add comparison button if not exists
  const taxSection = document.querySelector('.tax-section');
  if (!taxSection.querySelector('.regime-comparison')) {
    const comparisonDiv = document.createElement('div');
    comparisonDiv.className = 'regime-comparison';
    comparisonDiv.innerHTML = `
      <button class="btn btn-secondary" onclick="compareRegimes()">
        <i class="fas fa-balance-scale"></i>
        Compare Tax Regimes
      </button>
    `;
    
    taxSection.appendChild(comparisonDiv);
  }
}

/**
 * Handle tax form submission
 */
async function handleTaxSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const formData = parseFormData(form);
  
  // Validate form
  const validationRules = {
    annualIncome: { required: true, min: 1, label: 'Annual Income' },
    deductions: { required: true, min: 0, label: 'Deductions' }
  };
  
  if (!validateForm(form, validationRules)) {
    showToast('Please fix the errors in the form', 'error');
    return;
  }
  
  try {
    showLoading('Calculating tax...');
    
    // Perform calculation
    await performTaxCalculation(formData);
    
    hideLoading();
    showToast('Tax calculation completed', 'success');
    
  } catch (error) {
    hideLoading();
    console.error('Failed to calculate tax:', error);
    showToast('Failed to calculate tax. Please try again.', 'error');
  }
}

/**
 * Handle regime change
 */
function handleRegimeChange(e) {
  taxState.currentRegime = e.target.value;
  
  // Re-calculate with new regime
  const form = document.getElementById('taxForm');
  const formData = parseFormData(form);
  
  if (formData.annualIncome) {
    performTaxCalculation(formData);
  }
}

/**
 * Handle real-time calculation
 */
function handleRealtimeCalculation() {
  const form = document.getElementById('taxForm');
  const formData = parseFormData(form);
  
  if (formData.annualIncome > 0) {
    performTaxCalculation(formData);
  }
}

/**
 * Perform tax calculation
 */
async function performTaxCalculation(formData = null) {
  try {
    // Get form data if not provided
    if (!formData) {
      const form = document.getElementById('taxForm');
      formData = parseFormData(form);
    }
    
    // Calculate tax
    const income = formData.annualIncome || 0;
    const deductions = formData.deductions || 150000;
    const regime = formData.regime || 'new';
    
    // Use utility function for calculation
    const calculation = calculateIndianTax(income, deductions);
    
    // Add advance tax calculation
    calculation.advanceTax = calculateAdvanceTax(calculation.totalTax);
    
    // Add regime comparison if available
    if (regime === 'new') {
      calculation.oldRegimeTax = calculateOldRegimeTax(income, deductions);
    }
    
    // Update state
    taxState.currentCalculation = calculation;
    
    // Update UI
    updateTaxResults(calculation);
    updateAdvanceTaxSchedule(calculation.advanceTax);
    updateTaxSlabsVisualization(calculation.slabs);
    
  } catch (error) {
    console.error('Tax calculation error:', error);
    throw error;
  }
}

/**
 * Calculate old regime tax
 */
function calculateOldRegimeTax(income, deductions) {
  // Simplified old regime calculation
  const taxableIncome = Math.max(0, income - deductions);
  let tax = 0;
  
  // Old regime slabs (simplified)
  if (taxableIncome > 250000) {
    tax += Math.min(taxableIncome - 250000, 250000) * 0.05;
  }
  if (taxableIncome > 500000) {
    tax += Math.min(taxableIncome - 500000, 500000) * 0.2;
  }
  if (taxableIncome > 1000000) {
    tax += (taxableIncome - 1000000) * 0.3;
  }
  
  return tax;
}

/**
 * Update tax results display
 */
function updateTaxResults(calculation) {
  const resultsContainer = document.getElementById('taxResults');
  if (!resultsContainer) return;
  
  // Show results container
  resultsContainer.style.display = 'block';
  
  // Update values with animation
  updateAnimatedValue('grossIncome', calculation.grossIncome);
  updateAnimatedValue('totalDeductions', calculation.deductions);
  updateAnimatedValue('taxableIncome', calculation.taxableIncome);
  updateAnimatedValue('totalTax', calculation.totalTax);
  updateAnimatedValue('effectiveRate', calculation.effectiveRate, '', '%');
  
  // Add regime comparison if available
  if (calculation.oldRegimeTax !== undefined) {
    addRegimeComparison(calculation.totalTax, calculation.oldRegimeTax);
  }
}

/**
 * Update advance tax schedule
 */
function updateAdvanceTaxSchedule(advanceTax) {
  updateAnimatedValue('juneTax', advanceTax.june);
  updateAnimatedValue('septTax', advanceTax.september);
  updateAnimatedValue('decTax', advanceTax.december);
  updateAnimatedValue('marchTax', advanceTax.march);
}

/**
 * Update tax slabs visualization
 */
function updateTaxSlabsVisualization(slabs) {
  const container = document.getElementById('taxSlabsVisualization');
  if (!container) return;
  
  if (!slabs || slabs.length === 0) {
    container.innerHTML = '<p>No tax slabs applicable</p>';
    return;
  }
  
  const slabsHTML = slabs.map((slab, index) => `
    <div class="slab-item" style="animation-delay: ${index * 0.1}s">
      <div class="slab-range">${slab.range}</div>
      <div class="slab-rate">${slab.rate}</div>
      <div class="slab-amount">${formatCurrency(slab.amount)}</div>
    </div>
  `).join('');
  
  container.innerHTML = slabsHTML;
}

/**
 * Add regime comparison
 */
function addRegimeComparison(newRegimeTax, oldRegimeTax) {
  const resultsContainer = document.getElementById('taxResults');
  if (!resultsContainer) return;
  
  // Remove existing comparison
  const existingComparison = resultsContainer.querySelector('.regime-comparison-result');
  if (existingComparison) {
    existingComparison.remove();
  }
  
  // Create comparison
  const difference = oldRegimeTax - newRegimeTax;
  const betterRegime = difference > 0 ? 'new' : 'old';
  
  const comparisonHTML = `
    <div class="regime-comparison-result">
      <h4>Regime Comparison</h4>
      <div class="comparison-row">
        <span>New Regime:</span>
        <span>${formatCurrency(newRegimeTax)}</span>
      </div>
      <div class="comparison-row">
        <span>Old Regime:</span>
        <span>${formatCurrency(oldRegimeTax)}</span>
      </div>
      <div class="comparison-row highlight">
        <span>Difference:</span>
        <span class="${betterRegime === 'new' ? 'savings' : 'loss'}">
          ${formatCurrency(Math.abs(difference))} ${betterRegime === 'new' ? 'savings' : 'extra'}
        </span>
      </div>
      <div class="recommendation">
        <i class="fas fa-lightbulb"></i>
        <strong>${betterRegime === 'new' ? 'New' : 'Old'} regime is better for you!</strong>
      </div>
    </div>
  `;
  
  resultsContainer.insertAdjacentHTML('beforeend', comparisonHTML);
}

/**
 * Update animated value
 */
function updateAnimatedValue(elementId, value, prefix = '', suffix = '') {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  if (typeof value === 'number') {
    animateNumber(element, Math.round(value), 1000, prefix, suffix);
  } else {
    element.textContent = prefix + value + suffix;
  }
}

/**
 * Compare tax regimes
 */
function compareRegimes() {
  const form = document.getElementById('taxForm');
  const formData = parseFormData(form);
  
  if (!formData.annualIncome || formData.annualIncome <= 0) {
    showToast('Please enter annual income first', 'warning');
    return;
  }
  
  showLoading('Comparing regimes...');
  
  // Calculate both regimes
  const newRegimeCalculation = calculateIndianTax(formData.annualIncome, formData.deductions);
  const oldRegimeTax = calculateOldRegimeTax(formData.annualIncome, formData.deductions);
  
  // Show comparison modal
  showRegimeComparisonModal(newRegimeCalculation.totalTax, oldRegimeTax, formData.annualIncome);
  
  hideLoading();
}

/**
 * Show regime comparison modal
 */
function showRegimeComparisonModal(newTax, oldTax, income) {
  const difference = oldTax - newTax;
  const betterRegime = difference > 0 ? 'new' : 'old';
  
  const modalHTML = `
    <div class="modal-overlay" id="regimeModal">
      <div class="modal">
        <div class="modal-header">
          <h3>Tax Regime Comparison</h3>
          <button class="modal-close" onclick="closeRegimeModal()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="comparison-chart">
            <div class="regime-card ${betterRegime === 'new' ? 'recommended' : ''}">
              <h4>New Tax Regime</h4>
              <div class="tax-amount">${formatCurrency(newTax)}</div>
              <div class="features">
                <div class="feature">
                  <i class="fas fa-check text-success"></i>
                  Lower tax rates
                </div>
                <div class="feature">
                  <i class="fas fa-check text-success"></i>
                  No deductions required
                </div>
                <div class="feature">
                  <i class="fas fa-check text-success"></i>
                  Simpler calculation
                </div>
              </div>
            </div>
            <div class="regime-card ${betterRegime === 'old' ? 'recommended' : ''}">
              <h4>Old Tax Regime</h4>
              <div class="tax-amount">${formatCurrency(oldTax)}</div>
              <div class="features">
                <div class="feature">
                  <i class="fas fa-check text-success"></i>
                  Various deductions
                </div>
                <div class="feature">
                  <i class="fas fa-check text-success"></i>
                  Traditional calculation
                </div>
                <div class="feature">
                  <i class="fas fa-times text-danger"></i>
                  Complex process
                </div>
              </div>
            </div>
          </div>
          <div class="comparison-summary">
            <div class="summary-item ${betterRegime === 'new' ? 'savings' : 'loss'}">
              <span class="label">You would save:</span>
              <span class="amount">${formatCurrency(Math.abs(difference))}</span>
            </div>
            <div class="recommendation">
              <i class="fas fa-star text-warning"></i>
              <strong>${betterRegime === 'new' ? 'New' : 'Old'} regime is recommended for you</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Add modal to page
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Add animation
  requestAnimationFrame(() => {
    document.getElementById('regimeModal').classList.add('active');
  });
}

/**
 * Close regime comparison modal
 */
function closeRegimeModal() {
  const modal = document.getElementById('regimeModal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}

/**
 * Export tax calculation
 */
function exportTaxCalculation() {
  if (!taxState.currentCalculation) {
    showToast('No calculation to export', 'warning');
    return;
  }
  
  const exportData = {
    calculation: taxState.currentCalculation,
    regime: taxState.currentRegime,
    exportDate: new Date().toISOString(),
    userId: getCurrentUserId()
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
    type: 'application/json' 
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `tax-calculation-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  showToast('Tax calculation exported successfully', 'success');
}

/**
 * Generate tax report
 */
function generateTaxReport() {
  if (!taxState.currentCalculation) {
    showToast('No calculation data available', 'warning');
    return;
  }
  
  showLoading('Generating tax report...');
  
  // Create report content
  const report = generateTaxReportContent(taxState.currentCalculation);
  
  // Create and download PDF (simplified version)
  const blob = new Blob([report], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `tax-report-${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  hideLoading();
  showToast('Tax report generated successfully', 'success');
}

/**
 * Generate tax report content
 */
function generateTaxReportContent(calculation) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Tax Calculation Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin-bottom: 20px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .label { font-weight: bold; }
        .value { text-align: right; }
        .total { border-top: 2px solid #333; padding-top: 10px; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Tax Calculation Report</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
      </div>
      
      <div class="section">
        <h2>Income Details</h2>
        <div class="row">
          <span class="label">Gross Income:</span>
          <span class="value">${formatCurrency(calculation.grossIncome)}</span>
        </div>
        <div class="row">
          <span class="label">Deductions:</span>
          <span class="value">${formatCurrency(calculation.deductions)}</span>
        </div>
        <div class="row total">
          <span class="label">Taxable Income:</span>
          <span class="value">${formatCurrency(calculation.taxableIncome)}</span>
        </div>
      </div>
      
      <div class="section">
        <h2>Tax Calculation</h2>
        <div class="row total">
          <span class="label">Total Tax:</span>
          <span class="value">${formatCurrency(calculation.totalTax)}</span>
        </div>
        <div class="row">
          <span class="label">Effective Rate:</span>
          <span class="value">${calculation.effectiveRate.toFixed(2)}%</span>
        </div>
      </div>
      
      <div class="section">
        <h2>Advance Tax Schedule</h2>
        ${calculation.advanceTax ? `
          <div class="row">
            <span class="label">June 15:</span>
            <span class="value">${formatCurrency(calculation.advanceTax.june)}</span>
          </div>
          <div class="row">
            <span class="label">September 15:</span>
            <span class="value">${formatCurrency(calculation.advanceTax.september)}</span>
          </div>
          <div class="row">
            <span class="label">December 15:</span>
            <span class="value">${formatCurrency(calculation.advanceTax.december)}</span>
          </div>
          <div class="row">
            <span class="label">March 15:</span>
            <span class="value">${formatCurrency(calculation.advanceTax.march)}</span>
          </div>
        ` : ''}
      </div>
    </body>
    </html>
  `;
}

/**
 * Debounce utility
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Keyboard shortcuts
 */
document.addEventListener('keydown', (e) => {
  // Only on tax page
  if (getCurrentPageName() !== 'tax') return;
  
  // Ctrl/Cmd + C - Calculate
  if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
    e.preventDefault();
    document.getElementById('taxForm').dispatchEvent(new Event('submit'));
  }
  
  // Ctrl/Cmd + R - Compare regimes
  if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
    e.preventDefault();
    compareRegimes();
  }
  
  // Ctrl/Cmd + E - Export
  if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
    e.preventDefault();
    exportTaxCalculation();
  }
});

// Make functions globally available
window.compareRegimes = compareRegimes;
window.closeRegimeModal = closeRegimeModal;
window.exportTaxCalculation = exportTaxCalculation;
window.generateTaxReport = generateTaxReport;
