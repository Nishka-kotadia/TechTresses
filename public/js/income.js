/**
 * Income Management Page JavaScript
 * Handles income entry, editing, and management
 */

import { 
  formatCurrency, 
  formatDate, 
  showToast, 
  showLoading, 
  hideLoading,
  getCurrentUserId,
  parseFormData,
  validateForm,
  clearFormErrors,
  showFormError
} from './utils.js';
import { unifiedApi } from './api.js';

/**
 * Income page state
 */
let incomeState = {
  incomeList: [],
  isLoading: false,
  editingId: null,
  sortBy: 'date',
  sortOrder: 'desc'
};

/**
 * Initialize income page
 */
export async function initIncome() {
  try {
    console.log('Initializing income page...');
    showLoading('Loading income data...');
    
    // Load income data
    await loadIncomeData();
    
    // Update UI
    updateIncomeTable();
    updateStatistics();
    
    // Setup form handlers
    setupIncomeForm();
    
    // Setup filters and sorting
    setupFilters();
    
    hideLoading();
    showToast('Income data loaded successfully', 'success');
    
  } catch (error) {
    hideLoading();
    console.error('Failed to initialize income page:', error);
    showToast('Failed to load income data. Please try again.', 'error');
  }
}

/**
 * Load income data
 */
async function loadIncomeData() {
  const userId = getCurrentUserId();
  
  try {
    incomeState.incomeList = await unifiedApi.getIncome(userId);
  } catch (error) {
    console.error('Failed to load income data:', error);
    throw error;
  }
}

/**
 * Setup income form handlers
 */
function setupIncomeForm() {
  const form = document.getElementById('incomeForm');
  if (!form) return;
  
  // Form submission
  form.addEventListener('submit', handleIncomeSubmit);
  
  // Real-time calculation
  const amountInput = form.querySelector('#amount');
  const tdsCheckbox = form.querySelector('#tdsDeducted');
  const gstCheckbox = form.querySelector('#gstApplicable');
  
  [amountInput, tdsCheckbox, gstCheckbox].forEach(element => {
    element.addEventListener('change', calculateNetAmount);
  });
  
  // Form validation
  const inputs = form.querySelectorAll('input, textarea');
  inputs.forEach(input => {
    input.addEventListener('blur', () => validateField(input));
  });
}

/**
 * Setup filters and sorting
 */
function setupFilters() {
  // Add filter controls if not exists
  const incomeSection = document.querySelector('.income-section');
  if (!incomeSection.querySelector('.filters-bar')) {
    const filtersBar = document.createElement('div');
    filtersBar.className = 'filters-bar';
    filtersBar.innerHTML = `
      <div class="filter-group">
        <label>Sort by:</label>
        <select id="sortBy">
          <option value="date">Date</option>
          <option value="clientName">Client</option>
          <option value="amount">Amount</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Order:</label>
        <select id="sortOrder">
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Filter:</label>
        <input type="text" id="searchFilter" placeholder="Search clients...">
      </div>
      <button class="btn btn-secondary" onclick="exportIncomeData()">
        <i class="fas fa-download"></i>
        Export
      </button>
    `;
    
    incomeSection.insertBefore(filtersBar, incomeSection.querySelector('.income-list'));
    
    // Add event listeners
    document.getElementById('sortBy').addEventListener('change', applyFilters);
    document.getElementById('sortOrder').addEventListener('change', applyFilters);
    document.getElementById('searchFilter').addEventListener('input', debounce(applyFilters, 300));
  }
}

/**
 * Handle income form submission
 */
async function handleIncomeSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const formData = parseFormData(form);
  
  // Validate form
  const validationRules = {
    clientName: { required: true, label: 'Client Name' },
    amount: { required: true, min: 1, label: 'Amount' }
  };
  
  if (!validateForm(form, validationRules)) {
    showToast('Please fix the errors in the form', 'error');
    return;
  }
  
  try {
    showLoading('Saving income entry...');
    
    // Calculate derived values
    const netAmount = calculateNetAmount(formData);
    const tdsAmount = formData.tdsDeducted ? formData.amount * 0.1 : 0;
    const gstAmount = formData.gstApplicable ? formData.amount * 0.18 : 0;
    
    const incomeData = {
      ...formData,
      netAmount,
      tdsAmount,
      gstAmount,
      userId: getCurrentUserId()
    };
    
    // Save income
    const savedIncome = await unifiedApi.addIncome(incomeData);
    
    // Update state
    incomeState.incomeList.unshift(savedIncome);
    
    // Update UI
    updateIncomeTable();
    updateStatistics();
    
    // Reset form
    form.reset();
    calculateNetAmount(); // Update calculation display
    
    hideLoading();
    showToast('Income entry saved successfully', 'success');
    
  } catch (error) {
    hideLoading();
    console.error('Failed to save income:', error);
    showToast('Failed to save income entry. Please try again.', 'error');
  }
}

/**
 * Calculate net amount in real-time
 */
function calculateNetAmount() {
  const form = document.getElementById('incomeForm');
  if (!form) return;
  
  const amount = parseFloat(form.querySelector('#amount').value) || 0;
  const tdsDeducted = form.querySelector('#tdsDeducted').checked;
  const gstApplicable = form.querySelector('#gstApplicable').checked;
  
  const tdsAmount = tdsDeducted ? amount * 0.1 : 0;
  const gstAmount = gstApplicable ? amount * 0.18 : 0;
  const netAmount = amount - tdsAmount + gstAmount;
  
  // Update calculation display
  let calculationDisplay = `
    <div class="calculation-display">
      <div class="calc-row">
        <span>Amount:</span>
        <span>${formatCurrency(amount)}</span>
      </div>
  `;
  
  if (tdsDeducted) {
    calculationDisplay += `
      <div class="calc-row">
        <span>TDS (10%):</span>
        <span style="color: var(--success-color)">-${formatCurrency(tdsAmount)}</span>
      </div>
    `;
  }
  
  if (gstApplicable) {
    calculationDisplay += `
      <div class="calc-row">
        <span>GST (18%):</span>
        <span style="color: var(--accent-color)">+${formatCurrency(gstAmount)}</span>
      </div>
    `;
  }
  
  calculationDisplay += `
    <div class="calc-row total">
      <span><strong>Net Amount:</strong></span>
      <span><strong>${formatCurrency(netAmount)}</strong></span>
    </div>
    </div>
  `;
  
  // Update or create calculation display
  let displayElement = form.querySelector('.calculation-display');
  if (!displayElement) {
    displayElement = document.createElement('div');
    displayElement.className = 'calculation-display';
    form.appendChild(displayElement);
  }
  displayElement.innerHTML = calculationDisplay;
}

/**
 * Validate individual field
 */
function validateField(input) {
  const value = input.value.trim();
  let isValid = true;
  let message = '';
  
  // Remove previous error
  clearFormErrors(input.form);
  
  switch (input.name) {
    case 'clientName':
      if (!value) {
        isValid = false;
        message = 'Client name is required';
      } else if (value.length < 2) {
        isValid = false;
        message = 'Client name must be at least 2 characters';
      }
      break;
      
    case 'amount':
      if (!value) {
        isValid = false;
        message = 'Amount is required';
      } else if (parseFloat(value) <= 0) {
        isValid = false;
        message = 'Amount must be greater than 0';
      } else if (parseFloat(value) > 10000000) {
        isValid = false;
        message = 'Amount seems too high';
      }
      break;
  }
  
  if (!isValid) {
    showFormError(input, message);
  }
  
  return isValid;
}

/**
 * Update income table
 */
function updateIncomeTable() {
  const tbody = document.getElementById('incomeTableBody');
  if (!tbody) return;
  
  const filteredData = getFilteredData();
  
  if (filteredData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <div class="empty-message">
            <i class="fas fa-inbox"></i>
            <p>No income entries found</p>
            <button class="btn btn-primary" onclick="document.getElementById('incomeForm').scrollIntoView()">
              <i class="fas fa-plus"></i>
              Add Income Entry
            </button>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  const rowsHTML = filteredData.map((income, index) => `
    <tr class="income-row list-item" style="animation-delay: ${index * 0.05}s">
      <td>${formatDate(income.date)}</td>
      <td>
        <div class="client-info">
          <strong>${income.clientName}</strong>
          ${income.notes ? `<br><small>${income.notes}</small>` : ''}
        </div>
      </td>
      <td>${formatCurrency(income.amount)}</td>
      <td>
        ${income.tdsDeducted ? 
          `<span class="badge success">${formatCurrency(income.tdsAmount)}</span>` : 
          '<span class="badge">-</span>'
        }
      </td>
      <td>
        ${income.gstApplicable ? 
          `<span class="badge accent">${formatCurrency(income.gstAmount)}</span>` : 
          '<span class="badge">-</span>'
        }
      </td>
      <td><strong>${formatCurrency(income.netAmount)}</strong></td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-sm btn-secondary" onclick="editIncome('${income._id}')" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteIncome('${income._id}')" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
  
  tbody.innerHTML = rowsHTML;
}

/**
 * Update statistics
 */
function updateStatistics() {
  const { incomeList } = incomeState;
  
  // Calculate statistics
  const totalIncome = incomeList.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalNet = incomeList.reduce((sum, item) => sum + (item.netAmount || 0), 0);
  const totalTDS = incomeList.reduce((sum, item) => sum + (item.tdsAmount || 0), 0);
  const totalGST = incomeList.reduce((sum, item) => sum + (item.gstAmount || 0), 0);
  const avgIncome = incomeList.length > 0 ? totalIncome / incomeList.length : 0;
  
  // Update statistics display
  const statsContainer = document.querySelector('.income-stats');
  if (statsContainer) {
    statsContainer.innerHTML = `
      <div class="stat-item">
        <div class="stat-value">${formatCurrency(totalIncome)}</div>
        <div class="stat-label">Total Income</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${formatCurrency(totalNet)}</div>
        <div class="stat-label">Net Income</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${formatCurrency(totalTDS)}</div>
        <div class="stat-label">TDS Deducted</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${formatCurrency(totalGST)}</div>
        <div class="stat-label">GST Collected</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${formatCurrency(avgIncome)}</div>
        <div class="stat-label">Average Income</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${incomeList.length}</div>
        <div class="stat-label">Total Entries</div>
      </div>
    `;
  }
}

/**
 * Get filtered and sorted data
 */
function getFilteredData() {
  let filtered = [...incomeState.incomeList];
  
  // Apply search filter
  const searchTerm = document.getElementById('searchFilter')?.value.toLowerCase();
  if (searchTerm) {
    filtered = filtered.filter(income => 
      income.clientName.toLowerCase().includes(searchTerm) ||
      (income.notes && income.notes.toLowerCase().includes(searchTerm))
    );
  }
  
  // Apply sorting
  const sortBy = document.getElementById('sortBy')?.value || 'date';
  const sortOrder = document.getElementById('sortOrder')?.value || 'desc';
  
  filtered.sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    
    // Handle date sorting
    if (sortBy === 'date') {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    }
    
    // Handle numeric sorting
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });
  
  return filtered;
}

/**
 * Apply filters
 */
function applyFilters() {
  updateIncomeTable();
}

/**
 * Edit income entry
 */
function editIncome(incomeId) {
  const income = incomeState.incomeList.find(item => item._id === incomeId);
  if (!income) return;
  
  const form = document.getElementById('incomeForm');
  if (!form) return;
  
  // Populate form
  setFormData(form, income);
  
  // Update calculation
  calculateNetAmount();
  
  // Scroll to form
  form.scrollIntoView({ behavior: 'smooth' });
  
  // Focus first input
  form.querySelector('#clientName').focus();
  
  showToast('Edit the income entry and submit to save changes', 'info');
}

/**
 * Delete income entry
 */
async function deleteIncome(incomeId) {
  if (!confirm('Are you sure you want to delete this income entry?')) {
    return;
  }
  
  try {
    showLoading('Deleting income entry...');
    
    await unifiedApi.deleteIncome(incomeId);
    
    // Update state
    incomeState.incomeList = incomeState.incomeList.filter(item => item._id !== incomeId);
    
    // Update UI
    updateIncomeTable();
    updateStatistics();
    
    hideLoading();
    showToast('Income entry deleted successfully', 'success');
    
  } catch (error) {
    hideLoading();
    console.error('Failed to delete income:', error);
    showToast('Failed to delete income entry. Please try again.', 'error');
  }
}

/**
 * Export income data
 */
function exportIncomeData() {
  const { incomeList } = incomeState;
  
  if (incomeList.length === 0) {
    showToast('No data to export', 'warning');
    return;
  }
  
  const exportData = {
    income: incomeList,
    exportDate: new Date().toISOString(),
    statistics: {
      total: incomeList.reduce((sum, item) => sum + (item.amount || 0), 0),
      netTotal: incomeList.reduce((sum, item) => sum + (item.netAmount || 0), 0),
      entries: incomeList.length
    }
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
    type: 'application/json' 
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `income-data-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  showToast('Income data exported successfully', 'success');
}

/**
 * Set form data helper
 */
function setFormData(form, data) {
  Object.entries(data).forEach(([key, value]) => {
    const input = form.querySelector(`[name="${key}"]`);
    if (input) {
      if (input.type === 'checkbox') {
        input.checked = Boolean(value);
      } else {
        input.value = value || '';
      }
    }
  });
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
  // Only on income page
  if (getCurrentPageName() !== 'income') return;
  
  // Ctrl/Cmd + N - New income
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault();
    document.getElementById('incomeForm').scrollIntoView();
    document.querySelector('#clientName').focus();
  }
  
  // Ctrl/Cmd + E - Export
  if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
    e.preventDefault();
    exportIncomeData();
  }
});

// Make functions globally available
window.editIncome = editIncome;
window.deleteIncome = deleteIncome;
window.exportIncomeData = exportIncomeData;
