/**
 * Invoice Generator Page JavaScript
 * Handles invoice creation, preview, and PDF generation
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
  downloadFile
} from './utils.js';
import { unifiedApi } from './api.js';

/**
 * Invoice page state
 */
let invoiceState = {
  invoiceList: [],
  currentPreview: null,
  isLoading: false,
  user: null
};

/**
 * Initialize invoice page
 */
export async function initInvoice() {
  try {
    console.log('Initializing invoice page...');
    showLoading('Loading invoice data...');
    
    // Load user data
    await loadUserData();
    
    // Setup invoice form
    setupInvoiceForm();
    
    // Load invoice history
    await loadInvoiceHistory();
    
    // Setup invoice history
    updateInvoiceList();
    
    hideLoading();
    showToast('Invoice generator ready', 'success');
    
  } catch (error) {
    hideLoading();
    console.error('Failed to initialize invoice page:', error);
    showToast('Failed to load invoice generator. Please try again.', 'error');
  }
}

/**
 * Load user data
 */
async function loadUserData() {
  const userId = getCurrentUserId();
  
  try {
    invoiceState.user = await unifiedApi.getUserProfile(userId);
  } catch (error) {
    console.error('Failed to load user data:', error);
    invoiceState.user = {
      name: 'John Doe',
      email: 'john@freelancer.com',
      phone: '+91 98765 43210',
      pan: 'ABCDE1234F',
      bankName: 'State Bank of India',
      accountNumber: '1234567890123456',
      ifscCode: 'SBIN0001234',
      accountHolder: 'John Doe'
    };
  }
}

/**
 * Setup invoice form handlers
 */
function setupInvoiceForm() {
  const form = document.getElementById('invoiceForm');
  if (!form) return;
  
  // Form submission
  form.addEventListener('submit', handleInvoiceSubmit);
  
  // Real-time preview
  const inputs = form.querySelectorAll('input, textarea');
  inputs.forEach(input => {
    input.addEventListener('input', debounce(updatePreview, 500));
  });
  
  // Preview button
  const previewBtn = document.getElementById('previewInvoice');
  if (previewBtn) {
    previewBtn.addEventListener('click', updatePreview);
  }
}

/**
 * Load invoice history
 */
async function loadInvoiceHistory() {
  try {
    // For demo, create some sample invoices
    invoiceState.invoiceList = [
      {
        _id: '1',
        clientName: 'Tech Corp',
        amount: 50000,
        description: 'Website development project',
        tds: true,
        gst: false,
        date: '2024-01-15',
        invoiceNumber: 'INV-001',
        status: 'paid'
      },
      {
        _id: '2',
        clientName: 'Design Studio',
        amount: 30000,
        description: 'UI/UX design services',
        tds: false,
        gst: false,
        date: '2024-02-10',
        invoiceNumber: 'INV-002',
        status: 'pending'
      },
      {
        _id: '3',
        clientName: 'Startup XYZ',
        amount: 75000,
        description: 'Mobile app development',
        tds: true,
        gst: true,
        date: '2024-03-05',
        invoiceNumber: 'INV-003',
        status: 'sent'
      }
    ];
  } catch (error) {
    console.error('Failed to load invoice history:', error);
    invoiceState.invoiceList = [];
  }
}

/**
 * Handle invoice form submission
 */
async function handleInvoiceSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const formData = parseFormData(form);
  
  // Validate form
  const validationRules = {
    clientName: { required: true, label: 'Client Name' },
    amount: { required: true, min: 1, label: 'Amount' },
    description: { required: true, label: 'Description' }
  };
  
  if (!validateForm(form, validationRules)) {
    showToast('Please fix errors in form', 'error');
    return;
  }
  
  try {
    showLoading('Generating invoice...');
    
    // Prepare invoice data
    const invoiceData = {
      ...formData,
      userId: getCurrentUserId(),
      invoiceNumber: generateInvoiceNumber(),
      date: new Date().toISOString().split('T')[0]
    };
    
    // Generate PDF
    const pdfBlob = await unifiedApi.generateInvoice(invoiceData);
    
    // Download PDF
    const filename = `invoice-${invoiceData.invoiceNumber}.pdf`;
    downloadFile(pdfBlob, filename);
    
    // Add to history
    const newInvoice = {
      ...invoiceData,
      _id: Date.now().toString(),
      status: 'sent'
    };
    invoiceState.invoiceList.unshift(newInvoice);
    
    // Update UI
    updateInvoiceList();
    
    // Reset form
    form.reset();
    updatePreview();
    
    hideLoading();
    showToast('Invoice generated and downloaded successfully', 'success');
    
  } catch (error) {
    hideLoading();
    console.error('Failed to generate invoice:', error);
    showToast('Failed to generate invoice. Please try again.', 'error');
  }
}

/**
 * Update invoice preview
 */
function updatePreview() {
  const form = document.getElementById('invoiceForm');
  const formData = parseFormData(form);
  
  const previewContainer = document.getElementById('invoiceDocument');
  if (!previewContainer) return;
  
  // Calculate amounts
  const amount = formData.amount || 0;
  const tdsAmount = formData.tds ? amount * 0.1 : 0;
  const gstAmount = formData.gst ? amount * 0.18 : 0;
  const netAmount = amount - tdsAmount + gstAmount;
  
  // Update state
  invoiceState.currentPreview = {
    ...formData,
    tdsAmount,
    gstAmount,
    netAmount,
    invoiceNumber: generateInvoiceNumber(),
    date: new Date().toISOString().split('T')[0]
  };
  
  // Generate preview HTML
  const previewHTML = generateInvoicePreviewHTML(invoiceState.currentPreview);
  previewContainer.innerHTML = previewHTML;
}

/**
 * Generate invoice preview HTML
 */
function generateInvoicePreviewHTML(invoice) {
  const { user } = invoiceState;
  
  return `
    <div class="invoice-preview-content">
      <!-- Invoice Header -->
      <div class="invoice-header">
        <div class="invoice-from">
          <h2>INVOICE</h2>
          <div class="company-info">
            <strong>${user.name || 'John Doe'}</strong><br>
            ${user.email || 'john@freelancer.com'}<br>
            ${user.phone || '+91 98765 43210'}<br>
            PAN: ${user.pan || 'ABCDE1234F'}
          </div>
        </div>
        <div class="invoice-to">
          <h3>Bill To:</h3>
          <div class="client-info">
            <strong>${invoice.clientName || 'Client Name'}</strong>
          </div>
        </div>
      </div>
      
      <!-- Invoice Details -->
      <div class="invoice-details">
        <div class="detail-row">
          <span>Invoice Number:</span>
          <span>${invoice.invoiceNumber || 'INV-001'}</span>
        </div>
        <div class="detail-row">
          <span>Date:</span>
          <span>${formatDate(invoice.date)}</span>
        </div>
        <div class="detail-row">
          <span>Due Date:</span>
          <span>${formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))}</span>
        </div>
      </div>
      
      <!-- Invoice Items -->
      <div class="invoice-items">
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${invoice.description || 'Services rendered'}</td>
              <td>1</td>
              <td>${formatCurrency(invoice.amount || 0)}</td>
              <td>${formatCurrency(invoice.amount || 0)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Tax Breakdown -->
      <div class="invoice-breakdown">
        <div class="breakdown-row">
          <span>Subtotal:</span>
          <span>${formatCurrency(invoice.amount || 0)}</span>
        </div>
        ${invoice.tds ? `
          <div class="breakdown-row">
            <span>TDS (10%):</span>
            <span style="color: var(--success-color)">-${formatCurrency(invoice.tdsAmount)}</span>
          </div>
        ` : ''}
        ${invoice.gst ? `
          <div class="breakdown-row">
            <span>GST (18%):</span>
            <span style="color: var(--accent-color)">+${formatCurrency(invoice.gstAmount)}</span>
          </div>
        ` : ''}
        <div class="breakdown-row total">
          <span><strong>Total:</strong></span>
          <span><strong>${formatCurrency(invoice.netAmount || 0)}</strong></span>
        </div>
      </div>
      
      <!-- Bank Details -->
      <div class="invoice-bank">
        <h4>Bank Details</h4>
        <div class="bank-info">
          <div class="bank-row">
            <span>Bank Name:</span>
            <span>${user.bankName || 'State Bank of India'}</span>
          </div>
          <div class="bank-row">
            <span>Account Number:</span>
            <span>${user.accountNumber || '1234567890123456'}</span>
          </div>
          <div class="bank-row">
            <span>IFSC Code:</span>
            <span>${user.ifscCode || 'SBIN0001234'}</span>
          </div>
          <div class="bank-row">
            <span>Account Holder:</span>
            <span>${user.accountHolder || 'John Doe'}</span>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="invoice-footer">
        <p>Thank you for your business!</p>
        <p>This is a computer-generated invoice and does not require a signature.</p>
      </div>
    </div>
  `;
}

/**
 * Update invoice list
 */
function updateInvoiceList() {
  const container = document.getElementById('invoiceList');
  if (!container) return;
  
  if (invoiceState.invoiceList.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-file-invoice"></i>
        <p>No invoices generated yet</p>
        <button class="btn btn-primary" onclick="document.getElementById('invoiceForm').scrollIntoView()">
          <i class="fas fa-plus"></i>
          Create Your First Invoice
        </button>
      </div>
    `;
    return;
  }
  
  const invoicesHTML = invoiceState.invoiceList.map((invoice, index) => `
    <div class="invoice-item list-item" style="animation-delay: ${index * 0.1}s">
      <div class="invoice-info">
        <div class="invoice-header">
          <h4>${invoice.clientName}</h4>
          <span class="invoice-number">${invoice.invoiceNumber}</span>
        </div>
        <div class="invoice-details">
          <p><strong>Date:</strong> ${formatDate(invoice.date)}</p>
          <p><strong>Amount:</strong> ${formatCurrency(invoice.amount)}</p>
          <p><strong>Net:</strong> ${formatCurrency(invoice.netAmount)}</p>
        </div>
      </div>
      <div class="invoice-status">
        <span class="status-badge ${invoice.status}">${getStatusLabel(invoice.status)}</span>
        <div class="invoice-actions">
          <button class="btn btn-sm btn-secondary" onclick="viewInvoice('${invoice._id}')" title="View">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-sm btn-primary" onclick="downloadInvoice('${invoice._id}')" title="Download">
            <i class="fas fa-download"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');
  
  container.innerHTML = invoicesHTML;
}

/**
 * Get status label
 */
function getStatusLabel(status) {
  const labels = {
    'draft': 'Draft',
    'sent': 'Sent',
    'paid': 'Paid',
    'overdue': 'Overdue',
    'cancelled': 'Cancelled'
  };
  
  return labels[status] || status;
}

/**
 * Generate invoice number
 */
function generateInvoiceNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `INV-${year}${month}-${random}`;
}

/**
 * View invoice details
 */
function viewInvoice(invoiceId) {
  const invoice = invoiceState.invoiceList.find(inv => inv._id === invoiceId);
  if (!invoice) return;
  
  // Show invoice modal
  showInvoiceModal(invoice);
}

/**
 * Download invoice
 */
async function downloadInvoice(invoiceId) {
  const invoice = invoiceState.invoiceList.find(inv => inv._id === invoiceId);
  if (!invoice) return;
  
  try {
    showLoading('Downloading invoice...');
    
    // Generate PDF
    const pdfBlob = await unifiedApi.generateInvoice(invoice);
    
    // Download PDF
    const filename = `invoice-${invoice.invoiceNumber}.pdf`;
    downloadFile(pdfBlob, filename);
    
    hideLoading();
    showToast('Invoice downloaded successfully', 'success');
    
  } catch (error) {
    hideLoading();
    console.error('Failed to download invoice:', error);
    showToast('Failed to download invoice. Please try again.', 'error');
  }
}

/**
 * Show invoice modal
 */
function showInvoiceModal(invoice) {
  const modalHTML = `
    <div class="modal-overlay" id="invoiceModal">
      <div class="modal">
        <div class="modal-header">
          <h3>Invoice Details</h3>
          <button class="modal-close" onclick="closeInvoiceModal()">&times;</button>
        </div>
        <div class="modal-body">
          ${generateInvoicePreviewHTML(invoice)}
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeInvoiceModal()">Close</button>
          <button class="btn btn-primary" onclick="downloadInvoiceFromModal('${invoice._id}')">
            <i class="fas fa-download"></i>
            Download PDF
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Add modal to page
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Add animation
  requestAnimationFrame(() => {
    document.getElementById('invoiceModal').classList.add('active');
  });
}

/**
 * Close invoice modal
 */
function closeInvoiceModal() {
  const modal = document.getElementById('invoiceModal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}

/**
 * Download invoice from modal
 */
async function downloadInvoiceFromModal(invoiceId) {
  await downloadInvoice(invoiceId);
  closeInvoiceModal();
}

/**
 * Export invoice data
 */
function exportInvoiceData() {
  if (invoiceState.invoiceList.length === 0) {
    showToast('No invoice data to export', 'warning');
    return;
  }
  
  const exportData = {
    invoices: invoiceState.invoiceList,
    exportDate: new Date().toISOString(),
    statistics: {
      total: invoiceState.invoiceList.reduce((sum, inv) => sum + (inv.amount || 0), 0),
      netTotal: invoiceState.invoiceList.reduce((sum, inv) => sum + (inv.netAmount || 0), 0),
      count: invoiceState.invoiceList.length
    }
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
    type: 'application/json' 
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `invoice-data-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  showToast('Invoice data exported successfully', 'success');
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
  // Only on invoice page
  if (getCurrentPageName() !== 'invoice') return;
  
  // Ctrl/Cmd + N - New invoice
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault();
    document.getElementById('invoiceForm').scrollIntoView();
    document.querySelector('#invoiceClientName').focus();
  }
  
  // Ctrl/Cmd + P - Preview
  if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
    e.preventDefault();
    updatePreview();
  }
  
  // Ctrl/Cmd + E - Export
  if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
    e.preventDefault();
    exportInvoiceData();
  }
});

// Make functions globally available
window.viewInvoice = viewInvoice;
window.downloadInvoice = downloadInvoice;
window.closeInvoiceModal = closeInvoiceModal;
window.downloadInvoiceFromModal = downloadInvoiceFromModal;
window.exportInvoiceData = exportInvoiceData;
