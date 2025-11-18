/**
 * Simple Main Application JavaScript
 * Handles navigation and app initialization without ES6 modules
 */

// Global app state
let appState = {
  currentPage: 'dashboard',
  isInitialized: false
};

// Data storage (in-memory for demo)
let appData = {
  incomeEntries: [
    { id: 1, clientName: 'Client A', amount: 5000, tdsDeducted: true, gstApplicable: false, date: '2025-01-15', notes: 'Web design project' },
    { id: 2, clientName: 'Client B', amount: 7500, tdsDeducted: false, gstApplicable: true, date: '2025-01-10', notes: 'Mobile app development' }
  ],
  invoices: [
    { id: 1, clientName: 'Client A', amount: 5000, description: 'Web design project', tds: true, gst: false, date: '2025-01-15', status: 'sent' },
    { id: 2, clientName: 'Client B', amount: 7500, description: 'Mobile app development', tds: false, gst: true, date: '2025-01-10', status: 'paid' }
  ]
};

/**
 * Initialize application
 */
async function initializeApp() {
  try {
    showLoading('Initializing application...');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }

    // Initialize navigation
    initNavigation();
    
    // Initialize mobile menu
    initMobileMenu();
    
    // Initialize current page
    await initCurrentPage();
    
    // Setup global event listeners
    setupGlobalEventListeners();
    
    // Mark as initialized
    appState.isInitialized = true;
    
    hideLoading();
    showToast('Application ready!', 'success');
    
    console.log('TaxBuddy App initialized successfully');
    
  } catch (error) {
    hideLoading();
    console.error('Failed to initialize app:', error);
    showToast('Failed to initialize application. Please refresh the page.', 'error');
  }
}

/**
 * Initialize navigation system
 */
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link[data-page]');
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      navigateToPage(page);
      
      // Close mobile menu after navigation
      closeMobileMenu();
    });
  });

  // Handle browser back/forward buttons
  window.addEventListener('popstate', (e) => {
    const page = e.state?.page || 'dashboard';
    showPage(page, false);
  });
}

/**
 * Initialize mobile menu
 */
function initMobileMenu() {
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  
  if (navToggle && navMenu) {
    // Toggle mobile menu
    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      navToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
        closeMobileMenu();
      }
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeMobileMenu();
      }
    });

    // Close menu on window resize (desktop)
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        closeMobileMenu();
      }
    });
  }
}

/**
 * Close mobile menu
 */
function closeMobileMenu() {
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.querySelector('.nav-menu');
  
  if (navToggle && navMenu) {
    navToggle.classList.remove('active');
    navMenu.classList.remove('active');
  }
}

/**
 * Initialize current page based on URL or default
 */
async function initCurrentPage() {
  // Get page from URL hash or default to dashboard
  const hash = window.location.hash.slice(1);
  const page = hash || 'dashboard';
  
  await navigateToPage(page, false);
}

/**
 * Navigate to a specific page
 */
async function navigateToPage(page, updateHistory = true) {
  if (appState.currentPage === page) {
    return; // Already on this page
  }

  try {
    showLoading(`Loading ${page}...`);
    
    // Hide current page
    await hideCurrentPage();
    
    // Show new page
    await showPage(page, updateHistory);
    
    hideLoading();
    
  } catch (error) {
    hideLoading();
    console.error(`Failed to navigate to ${page}:`, error);
    showToast(`Failed to load ${page}. Please try again.`, 'error');
  }
}

/**
 * Hide current page with animation
 */
async function hideCurrentPage() {
  if (!appState.currentPage) return;
  
  const currentPageElement = document.getElementById(appState.currentPage);
  if (currentPageElement) {
    currentPageElement.classList.add('page-transition-exit');
    
    // Wait for exit animation
    await new Promise(resolve => {
      setTimeout(resolve, 300);
    });
    
    currentPageElement.classList.remove('active', 'page-transition-exit');
  }
}

/**
 * Show new page with animation
 */
async function showPage(page, updateHistory = true) {
  const pageElement = document.getElementById(page);
  if (!pageElement) {
    throw new Error(`Page element "${page}" not found`);
  }

  // Update navigation active state
  updateNavigation(page);
  
  // Show page with animation
  pageElement.classList.add('page-transition-enter');
  
  // Wait a frame for animation to start
  await new Promise(resolve => {
    requestAnimationFrame(resolve);
  });
  
  pageElement.classList.add('active', 'page-transition-enter-active');
  
  // Wait for enter animation
  await new Promise(resolve => {
    setTimeout(resolve, 300);
  });
  
  pageElement.classList.remove('page-transition-enter', 'page-transition-enter-active');
  
  // Initialize page-specific functionality
  initializePageContent(page);
  
  // Update current page
  appState.currentPage = page;
  
  // Update browser history
  if (updateHistory) {
    const url = `#${page}`;
    window.history.pushState({ page }, '', url);
  }
}

/**
 * Update navigation active state
 */
function updateNavigation(activePage) {
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    const page = link.dataset.page;
    if (page === activePage) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/**
 * Initialize page-specific content
 */
function initializePageContent(page) {
  switch (page) {
    case 'dashboard':
      initializeDashboard();
      break;
    case 'income':
      initializeIncome();
      break;
    case 'tax':
      initializeTax();
      break;
    case 'invoice':
      initializeInvoice();
      break;
    case 'profile':
      initializeProfile();
      break;
  }
}

/**
 * Initialize Dashboard
 */
function initializeDashboard() {
  console.log('Initializing dashboard...');
  // Add dashboard-specific initialization here
  loadDashboardData();
}

/**
 * Initialize Income
 */
function initializeIncome() {
  console.log('Initializing income page...');
  // Add income-specific initialization here
  loadIncomeData();
  setupIncomeForm();
}

/**
 * Initialize Tax
 */
function initializeTax() {
  console.log('Initializing tax page...');
  // Add tax-specific initialization here
  setupTaxForm();
}

/**
 * Initialize Invoice
 */
function initializeInvoice() {
  console.log('Initializing invoice page...');
  // Add invoice-specific initialization here
  loadInvoiceData();
  setupInvoiceForm();
}

/**
 * Initialize Profile
 */
function initializeProfile() {
  console.log('Initializing profile page...');
  // Add profile-specific initialization here
  setupProfileForm();
}

/**
 * Load Dashboard Data
 */
function loadDashboardData() {
  // Mock data for demonstration
  updateDashboardStats({
    totalIncome: 125000,
    totalInvoices: 15,
    taxDue: 25000,
    nextDue: 'March 15, 2025'
  });
  
  loadRecentTransactions();
}

/**
 * Update Dashboard Stats
 */
function updateDashboardStats(stats) {
  const elements = {
    totalIncome: document.getElementById('totalIncome'),
    totalInvoices: document.getElementById('totalInvoices'),
    taxDue: document.getElementById('taxDue'),
    nextDue: document.getElementById('nextDue')
  };
  
  if (elements.totalIncome) {
    elements.totalIncome.textContent = formatCurrency(stats.totalIncome);
  }
  if (elements.totalInvoices) {
    elements.totalInvoices.textContent = stats.totalInvoices;
  }
  if (elements.taxDue) {
    elements.taxDue.textContent = formatCurrency(stats.taxDue);
  }
  if (elements.nextDue) {
    elements.nextDue.textContent = stats.nextDue;
  }
}

/**
 * Load Recent Transactions
 */
function loadRecentTransactions() {
  const container = document.getElementById('recentTransactions');
  if (!container) return;
  
  // Mock data
  const transactions = [
    { client: 'Client A', amount: 5000, date: '2025-01-15', type: 'income' },
    { client: 'Client B', amount: 7500, date: '2025-01-10', type: 'income' },
    { client: 'Client C', amount: 3000, date: '2025-01-05', type: 'income' }
  ];
  
  const html = transactions.map(transaction => `
    <div class="transaction-item">
      <div class="transaction-icon">
        <i class="fas fa-arrow-down"></i>
      </div>
      <div class="transaction-details">
        <div class="transaction-client">${transaction.client}</div>
        <div class="transaction-date">${formatDate(transaction.date)}</div>
      </div>
      <div class="transaction-amount">${formatCurrency(transaction.amount)}</div>
    </div>
  `).join('');
  
  container.innerHTML = html;
}

/**
 * Load Income Data
 */
function loadIncomeData() {
  const tbody = document.getElementById('incomeTableBody');
  if (!tbody) return;
  
  if (appData.incomeEntries.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center">
          <div class="empty-state">
            <i class="fas fa-inbox"></i>
            <p>No income entries yet. Add your first income entry!</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  const html = appData.incomeEntries.map(income => {
    const tdsAmount = income.tdsDeducted ? income.amount * 0.1 : 0;
    const gstAmount = income.gstApplicable ? income.amount * 0.18 : 0;
    const netAmount = income.amount - tdsAmount + gstAmount;
    
    return `
      <tr>
        <td>${formatDate(income.date)}</td>
        <td>${income.clientName}</td>
        <td>${formatCurrency(income.amount)}</td>
        <td>${income.tdsDeducted ? formatCurrency(tdsAmount) : '-'}</td>
        <td>${income.gstApplicable ? formatCurrency(gstAmount) : '-'}</td>
        <td><strong>${formatCurrency(netAmount)}</strong></td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="editIncome(${income.id})">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteIncome(${income.id})">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
  
  tbody.innerHTML = html;
}

/**
 * Setup Income Form
 */
function setupIncomeForm() {
  const form = document.getElementById('incomeForm');
  if (!form) return;
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(form);
    const incomeData = {
      id: Date.now(), // Simple ID generation
      clientName: formData.get('clientName'),
      amount: parseFloat(formData.get('amount')),
      tdsDeducted: formData.get('tdsDeducted') === 'on',
      gstApplicable: formData.get('gstApplicable') === 'on',
      notes: formData.get('notes'),
      date: new Date().toISOString().split('T')[0] // Today's date
    };
    
    // Validate data
    if (!incomeData.clientName || !incomeData.amount || incomeData.amount <= 0) {
      showToast('Please fill in all required fields correctly.', 'error');
      return;
    }
    
    // Add to data store
    appData.incomeEntries.unshift(incomeData);
    
    // Update dashboard stats
    updateDashboardFromIncome();
    
    // Reload income table
    loadIncomeData();
    
    // Reset form
    form.reset();
    
    // Show success message
    showToast(`Income entry for ${incomeData.clientName} added successfully!`, 'success');
  });
}

/**
 * Update dashboard stats from income data
 */
function updateDashboardFromIncome() {
  const totalIncome = appData.incomeEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const totalInvoices = appData.invoices.length;
  
  updateDashboardStats({
    totalIncome: totalIncome,
    totalInvoices: totalInvoices,
    taxDue: Math.round(totalIncome * 0.2), // Rough estimate
    nextDue: 'March 15, 2025'
  });
}

/**
 * Edit income entry
 */
function editIncome(id) {
  const income = appData.incomeEntries.find(entry => entry.id === id);
  if (!income) return;
  
  // Fill form with existing data
  const form = document.getElementById('incomeForm');
  form.querySelector('#clientName').value = income.clientName;
  form.querySelector('#amount').value = income.amount;
  form.querySelector('#tdsDeducted').checked = income.tdsDeducted;
  form.querySelector('#gstApplicable').checked = income.gstApplicable;
  form.querySelector('#notes').value = income.notes || '';
  
  // Remove the entry being edited
  appData.incomeEntries = appData.incomeEntries.filter(entry => entry.id !== id);
  loadIncomeData();
  
  showToast('Edit the income details and submit to save changes.', 'info');
  
  // Scroll to form
  form.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Delete income entry
 */
function deleteIncome(id) {
  if (!confirm('Are you sure you want to delete this income entry?')) return;
  
  const income = appData.incomeEntries.find(entry => entry.id === id);
  if (!income) return;
  
  // Remove entry
  appData.incomeEntries = appData.incomeEntries.filter(entry => entry.id !== id);
  
  // Update dashboard
  updateDashboardFromIncome();
  
  // Reload table
  loadIncomeData();
  
  showToast(`Income entry for ${income.clientName} deleted.`, 'warning');
}

/**
 * Setup Tax Form
 */
function setupTaxForm() {
  const form = document.getElementById('taxForm');
  if (!form) return;
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    calculateTax();
  });
}

/**
 * Load Invoice Data
 */
function loadInvoiceData() {
  const container = document.getElementById('invoiceList');
  if (!container) return;
  
  if (appData.invoices.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-file-invoice"></i>
        <p>No invoices generated yet. Create your first invoice!</p>
      </div>
    `;
    return;
  }
  
  const html = appData.invoices.map(invoice => `
    <div class="invoice-item">
      <div class="invoice-info">
        <div class="invoice-header">
          <h4>${invoice.clientName}</h4>
          <span class="invoice-number">#INV-${String(invoice.id).padStart(4, '0')}</span>
        </div>
        <div class="invoice-details">
          <p><strong>Amount:</strong> ${formatCurrency(invoice.amount)}</p>
          <p><strong>Date:</strong> ${formatDate(invoice.date)}</p>
          <p><strong>Status:</strong> <span class="status-badge ${invoice.status}">${invoice.status}</span></p>
        </div>
      </div>
      <div class="invoice-actions">
        <button class="btn btn-sm btn-secondary" onclick="viewInvoice(${invoice.id})">View</button>
        <button class="btn btn-sm btn-primary" onclick="downloadInvoice(${invoice.id})">Download</button>
      </div>
    </div>
  `).join('');
  
  container.innerHTML = html;
}

/**
 * Setup Invoice Form
 */
function setupInvoiceForm() {
  const form = document.getElementById('invoiceForm');
  if (!form) return;
  
  // Add preview button functionality
  const previewBtn = document.getElementById('previewInvoice');
  if (previewBtn) {
    previewBtn.addEventListener('click', (e) => {
      e.preventDefault();
      generateInvoicePreview();
    });
  }
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    generateInvoice();
  });
}

/**
 * Generate Invoice Preview
 */
function generateInvoicePreview() {
  const form = document.getElementById('invoiceForm');
  const formData = new FormData(form);
  
  const invoiceData = {
    clientName: formData.get('clientName'),
    amount: parseFloat(formData.get('amount')),
    description: formData.get('description'),
    tds: formData.get('tds') === 'on',
    gst: formData.get('gst') === 'on',
    notes: formData.get('notes'),
    date: new Date().toISOString().split('T')[0]
  };
  
  // Validate data
  if (!invoiceData.clientName || !invoiceData.amount || invoiceData.amount <= 0) {
    showToast('Please fill in all required fields.', 'error');
    return;
  }
  
  // Generate preview HTML
  const previewHtml = generateInvoiceHTML(invoiceData);
  
  // Update preview container
  const previewContainer = document.getElementById('invoiceDocument');
  if (previewContainer) {
    previewContainer.innerHTML = previewHtml;
  }
  
  showToast('Invoice preview generated!', 'success');
}

/**
 * Generate and Save Invoice
 */
function generateInvoice() {
  const form = document.getElementById('invoiceForm');
  const formData = new FormData(form);
  
  const invoiceData = {
    id: Date.now(),
    clientName: formData.get('clientName'),
    amount: parseFloat(formData.get('amount')),
    description: formData.get('description'),
    tds: formData.get('tds') === 'on',
    gst: formData.get('gst') === 'on',
    notes: formData.get('notes'),
    date: new Date().toISOString().split('T')[0],
    status: 'draft'
  };
  
  // Validate data
  if (!invoiceData.clientName || !invoiceData.amount || invoiceData.amount <= 0) {
    showToast('Please fill in all required fields.', 'error');
    return;
  }
  
  // Add to data store
  appData.invoices.unshift(invoiceData);
  
  // Update dashboard stats
  updateDashboardFromIncome();
  
  // Reload invoice list
  loadInvoiceData();
  
  // Reset form
  form.reset();
  
  // Clear preview
  const previewContainer = document.getElementById('invoiceDocument');
  if (previewContainer) {
    previewContainer.innerHTML = '<p class="text-center text-gray-500">Fill in the form and click "Preview" to see the invoice</p>';
  }
  
  // Show success message
  showToast(`Invoice for ${invoiceData.clientName} generated successfully!`, 'success');
}

/**
 * Generate Invoice HTML
 */
function generateInvoiceHTML(data) {
  const tdsAmount = data.tds ? data.amount * 0.1 : 0;
  const gstAmount = data.gst ? data.amount * 0.18 : 0;
  const totalAmount = data.amount - tdsAmount + gstAmount;
  
  return `
    <div class="invoice-preview-content">
      <div class="invoice-header">
        <div class="invoice-from">
          <h2>TaxBuddy Invoice</h2>
          <div class="company-info">
            <p>Your Name</p>
            <p>Your Address</p>
            <p>Phone: +91 98765 43210</p>
            <p>Email: your@email.com</p>
            <p>PAN: ABCDE1234F</p>
          </div>
        </div>
        <div class="invoice-to">
          <h3>Bill To:</h3>
          <div class="client-info">
            <p><strong>${data.clientName}</strong></p>
            <p>Client Address</p>
            <p>Client Phone/Email</p>
          </div>
        </div>
      </div>
      
      <div class="invoice-details">
        <div class="detail-row">
          <span><strong>Invoice Number:</strong></span>
          <span>#INV-${String(Date.now()).slice(-6)}</span>
        </div>
        <div class="detail-row">
          <span><strong>Date:</strong></span>
          <span>${formatDate(data.date)}</span>
        </div>
        <div class="detail-row">
          <span><strong>Due Date:</strong></span>
          <span>${formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])}</span>
        </div>
      </div>
      
      <div class="invoice-items">
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
              <th>TDS (10%)</th>
              <th>GST (18%)</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${data.description}</td>
              <td>${formatCurrency(data.amount)}</td>
              <td>${data.tds ? formatCurrency(tdsAmount) : '-'}</td>
              <td>${data.gst ? formatCurrency(gstAmount) : '-'}</td>
              <td><strong>${formatCurrency(totalAmount)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="invoice-breakdown">
        <div class="breakdown-row">
          <span>Subtotal:</span>
          <span>${formatCurrency(data.amount)}</span>
        </div>
        ${data.tds ? `
        <div class="breakdown-row">
          <span>TDS Deduction (10%):</span>
          <span>-${formatCurrency(tdsAmount)}</span>
        </div>` : ''}
        ${data.gst ? `
        <div class="breakdown-row">
          <span>GST (18%):</span>
          <span>+${formatCurrency(gstAmount)}</span>
        </div>` : ''}
        <div class="breakdown-row total">
          <span><strong>Total Amount:</strong></span>
          <span><strong>${formatCurrency(totalAmount)}</strong></span>
        </div>
      </div>
      
      ${data.notes ? `
      <div class="invoice-notes">
        <h4>Notes:</h4>
        <p>${data.notes}</p>
      </div>` : ''}
      
      <div class="invoice-bank">
        <h4>Bank Details:</h4>
        <div class="bank-info">
          <div class="bank-row">
            <span>Bank Name:</span>
            <span>State Bank of India</span>
          </div>
          <div class="bank-row">
            <span>Account Number:</span>
            <span>1234567890123456</span>
          </div>
          <div class="bank-row">
            <span>IFSC Code:</span>
            <span>SBIN0001234</span>
          </div>
          <div class="bank-row">
            <span>Account Holder:</span>
            <span>Your Name</span>
          </div>
        </div>
      </div>
      
      <div class="invoice-footer">
        <p>Thank you for your business!</p>
        <p>This is a computer-generated invoice.</p>
      </div>
    </div>
  `;
}

/**
 * View Invoice
 */
function viewInvoice(id) {
  const invoice = appData.invoices.find(inv => inv.id === id);
  if (!invoice) return;
  
  // Generate invoice HTML
  const invoiceHtml = generateInvoiceHTML(invoice);
  
  // Update preview container
  const previewContainer = document.getElementById('invoiceDocument');
  if (previewContainer) {
    previewContainer.innerHTML = invoiceHtml;
  }
  
  // Scroll to preview
  previewContainer.scrollIntoView({ behavior: 'smooth' });
  
  showToast(`Viewing invoice for ${invoice.clientName}`, 'info');
}

/**
 * Download Invoice (Mock)
 */
function downloadInvoice(id) {
  const invoice = appData.invoices.find(inv => inv.id === id);
  if (!invoice) return;
  
  // In a real app, this would generate a PDF
  // For demo, we'll show a success message
  showToast(`Downloading invoice for ${invoice.clientName}...`, 'info');
  
  setTimeout(() => {
    showToast(`Invoice #INV-${String(invoice.id).padStart(4, '0')} downloaded successfully!`, 'success');
  }, 1500);
}

/**
 * Setup Profile Form
 */
function setupProfileForm() {
  const form = document.getElementById('profileForm');
  if (!form) return;
  
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('Profile saved successfully!', 'success');
  });
}

/**
 * Calculate Tax
 */
function calculateTax() {
  const form = document.getElementById('taxForm');
  const annualIncome = parseFloat(form.querySelector('#annualIncome').value) || 0;
  const deductions = parseFloat(form.querySelector('#deductions').value) || 0;
  
  const taxResult = calculateIndianTax(annualIncome, deductions);
  
  // Show results
  const resultsDiv = document.getElementById('taxResults');
  resultsDiv.style.display = 'block';
  
  // Update result elements
  document.getElementById('grossIncome').textContent = formatCurrency(taxResult.grossIncome);
  document.getElementById('totalDeductions').textContent = formatCurrency(taxResult.deductions);
  document.getElementById('taxableIncome').textContent = formatCurrency(taxResult.taxableIncome);
  document.getElementById('totalTax').textContent = formatCurrency(taxResult.totalTax);
  document.getElementById('effectiveRate').textContent = taxResult.effectiveRate.toFixed(1) + '%';
  
  // Update advance tax schedule
  const advanceTax = calculateAdvanceTax(taxResult.totalTax);
  document.getElementById('juneTax').textContent = formatCurrency(advanceTax.june);
  document.getElementById('septTax').textContent = formatCurrency(advanceTax.september);
  document.getElementById('decTax').textContent = formatCurrency(advanceTax.december);
  document.getElementById('marchTax').textContent = formatCurrency(advanceTax.march);
}

/**
 * Setup global event listeners
 */
function setupGlobalEventListeners() {
  // Handle window resize
  window.addEventListener('resize', throttle(() => {
    // Handle resize if needed
  }, 250));
  
  // Handle online/offline status
  window.addEventListener('online', () => {
    showToast('Connection restored', 'success');
  });
  
  window.addEventListener('offline', () => {
    showToast('Connection lost. Working offline.', 'warning');
  });
}

/**
 * Format currency
 */
function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '₹0';
  
  const num = parseFloat(amount);
  if (isNaN(num)) return '₹0';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
}

/**
 * Format date
 */
function formatDate(dateString) {
  if (!dateString) return '--';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '--';
  
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Show loading overlay
 */
function showLoading(message = 'Loading...') {
  const overlay = document.getElementById('loadingOverlay');
  const messageElement = overlay.querySelector('p');
  messageElement.textContent = message;
  overlay.classList.add('active');
}

/**
 * Hide loading overlay
 */
function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  overlay.classList.remove('active');
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success', duration = 3000) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = getToastIcon(type);
  
  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-message">${message}</div>
  `;
  
  container.appendChild(toast);
  
  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('notification-slide');
  });
  
  // Auto remove
  setTimeout(() => {
    toast.classList.add('notification-exit');
    setTimeout(() => {
      container.removeChild(toast);
    }, 300);
  }, duration);
}

/**
 * Get toast icon
 */
function getToastIcon(type) {
  const icons = {
    success: '<i class="fas fa-check-circle"></i>',
    error: '<i class="fas fa-exclamation-circle"></i>',
    warning: '<i class="fas fa-exclamation-triangle"></i>',
    info: '<i class="fas fa-info-circle"></i>'
  };
  return icons[type] || icons.info;
}

/**
 * Throttle function
 */
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Calculate Indian tax (simplified version)
 */
function calculateIndianTax(income, deductions = 0) {
  const taxableIncome = Math.max(0, income - deductions);
  let tax = 0;
  
  // Simplified tax calculation
  if (taxableIncome <= 250000) {
    tax = 0;
  } else if (taxableIncome <= 500000) {
    tax = (taxableIncome - 250000) * 0.05;
  } else if (taxableIncome <= 750000) {
    tax = 12500 + (taxableIncome - 500000) * 0.10;
  } else if (taxableIncome <= 1000000) {
    tax = 37500 + (taxableIncome - 750000) * 0.15;
  } else if (taxableIncome <= 1250000) {
    tax = 75000 + (taxableIncome - 1000000) * 0.20;
  } else if (taxableIncome <= 1500000) {
    tax = 125000 + (taxableIncome - 1250000) * 0.25;
  } else {
    tax = 187500 + (taxableIncome - 1500000) * 0.30;
  }
  
  return {
    grossIncome: income,
    deductions: deductions,
    taxableIncome: taxableIncome,
    totalTax: tax,
    effectiveRate: taxableIncome > 0 ? (tax / taxableIncome) * 100 : 0
  };
}

/**
 * Calculate advance tax
 */
function calculateAdvanceTax(totalTax) {
  return {
    june: Math.round(totalTax * 0.15),
    september: Math.round(totalTax * 0.45),
    december: Math.round(totalTax * 0.75),
    march: Math.round(totalTax * 1.0)
  };
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Make functions globally available
window.navigateToPage = navigateToPage;
window.showToast = showToast;
window.formatCurrency = formatCurrency;
window.editIncome = editIncome;
window.deleteIncome = deleteIncome;
window.viewInvoice = viewInvoice;
window.downloadInvoice = downloadInvoice;
window.generateInvoicePreview = generateInvoicePreview;
window.generateInvoice = generateInvoice;
