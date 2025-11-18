/**
 * Dashboard Page JavaScript
 * Handles dashboard functionality, stats, and charts
 */

import { 
  formatCurrency, 
  formatDate, 
  animateNumber, 
  showToast, 
  showLoading, 
  hideLoading,
  getCurrentUserId,
  getNextTaxDueDate,
  calculatePercentage
} from './utils.js';
import { unifiedApi } from './api.js';
import { drawIncomeChart, drawTaxChart } from './charts.js';

/**
 * Dashboard state management
 */
let dashboardState = {
  incomeData: [],
  taxData: null,
  user: null,
  isLoading: false,
  charts: {
    income: null,
    tax: null
  }
};

/**
 * Initialize dashboard page
 */
export async function initDashboard() {
  try {
    console.log('Initializing dashboard...');
    showLoading('Loading dashboard data...');
    
    // Load all data
    await loadDashboardData();
    
    // Update UI
    updateStatCards();
    updateRecentTransactions();
    updateCharts();
    
    // Setup refresh functionality
    setupRefreshButton();
    
    // Setup auto-refresh (every 5 minutes)
    setupAutoRefresh();
    
    hideLoading();
    showToast('Dashboard loaded successfully', 'success');
    
  } catch (error) {
    hideLoading();
    console.error('Failed to initialize dashboard:', error);
    showToast('Failed to load dashboard. Please try again.', 'error');
  }
}

/**
 * Load all dashboard data
 */
async function loadDashboardData() {
  const userId = getCurrentUserId();
  
  try {
    // Load data in parallel
    const [incomeData, taxData, userData] = await Promise.all([
      unifiedApi.getIncome(userId),
      unifiedApi.calculateTax(userId),
      unifiedApi.getUserProfile(userId)
    ]);
    
    dashboardState.incomeData = incomeData || [];
    dashboardState.taxData = taxData;
    dashboardState.user = userData;
    
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
    throw error;
  }
}

/**
 * Update stat cards with animations
 */
function updateStatCards() {
  const { incomeData, taxData } = dashboardState;
  
  // Calculate totals
  const totalIncome = incomeData.reduce((sum, item) => sum + (item.netAmount || 0), 0);
  const totalInvoices = incomeData.length;
  const totalTax = taxData?.totalTax || 0;
  
  // Get next due date
  const nextDue = getNextTaxDueDate();
  
  // Update DOM elements with animation
  updateStatCard('totalIncome', totalIncome, '₹');
  updateStatCard('totalInvoices', totalInvoices);
  updateStatCard('taxDue', totalTax, '₹');
  updateStatCard('nextDue', nextDue.name);
}

/**
 * Update individual stat card with animation
 */
function updateStatCard(elementId, value, prefix = '') {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  // Add animation class
  element.classList.add('counter-animate');
  
  // Animate number if it's a numeric value
  if (typeof value === 'number') {
    animateNumber(element, value, 1500, prefix);
  } else {
    element.textContent = value;
  }
  
  // Remove animation class after completion
  setTimeout(() => {
    element.classList.remove('counter-animate');
  }, 1500);
}

/**
 * Update recent transactions list
 */
function updateRecentTransactions() {
  const container = document.getElementById('recentTransactions');
  if (!container) return;
  
  const { incomeData } = dashboardState;
  
  // Get last 5 transactions
  const recentTransactions = incomeData
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
  
  if (recentTransactions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-inbox"></i>
        <p>No income entries yet</p>
        <button class="btn btn-primary" onclick="navigateToPage('income')">
          <i class="fas fa-plus"></i>
          Add Your First Income
        </button>
      </div>
    `;
    return;
  }
  
  // Generate transaction HTML
  const transactionsHTML = recentTransactions.map((transaction, index) => `
    <div class="transaction-item list-item" style="animation-delay: ${index * 0.1}s">
      <div class="transaction-info">
        <div class="transaction-client">${transaction.clientName}</div>
        <div class="transaction-date">${formatDate(transaction.date)}</div>
      </div>
      <div class="transaction-amount">
        ${formatCurrency(transaction.netAmount)}
        ${transaction.tdsDeducted ? '<small style="color: var(--success-color)"> (TDS)</small>' : ''}
        ${transaction.gstApplicable ? '<small style="color: var(--accent-color)"> (GST)</small>' : ''}
      </div>
    </div>
  `).join('');
  
  container.innerHTML = transactionsHTML;
}

/**
 * Update charts
 */
function updateCharts() {
  const { incomeData, taxData } = dashboardState;
  
  // Draw income chart
  drawIncomeChart('incomeCanvas', incomeData);
  
  // Draw tax chart
  if (taxData) {
    drawTaxChart('taxCanvas', taxData);
  }
}

/**
 * Setup refresh button
 */
function setupRefreshButton() {
  // Add refresh button to page header if not exists
  const pageHeader = document.querySelector('#dashboard .page-header');
  if (!pageHeader.querySelector('.refresh-btn')) {
    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'btn btn-secondary refresh-btn';
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
    refreshBtn.style.marginLeft = 'auto';
    refreshBtn.onclick = refreshDashboard;
    pageHeader.appendChild(refreshBtn);
  }
}

/**
 * Setup auto-refresh
 */
function setupAutoRefresh() {
  // Refresh every 5 minutes
  setInterval(async () => {
    if (!document.hidden) {
      try {
        await loadDashboardData();
        updateStatCards();
        updateRecentTransactions();
        updateCharts();
        showToast('Dashboard data refreshed', 'success');
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Refresh dashboard data
 */
async function refreshDashboard() {
  if (dashboardState.isLoading) return;
  
  try {
    dashboardState.isLoading = true;
    showLoading('Refreshing dashboard...');
    
    await loadDashboardData();
    updateStatCards();
    updateRecentTransactions();
    updateCharts();
    
    hideLoading();
    showToast('Dashboard refreshed successfully', 'success');
    
  } catch (error) {
    hideLoading();
    console.error('Failed to refresh dashboard:', error);
    showToast('Failed to refresh dashboard', 'error');
  } finally {
    dashboardState.isLoading = false;
  }
}

/**
 * Export dashboard data
 */
function exportDashboardData() {
  const { incomeData, taxData, user } = dashboardState;
  
  const exportData = {
    user: user,
    income: incomeData,
    tax: taxData,
    exportDate: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
    type: 'application/json' 
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `taxbuddy-dashboard-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  showToast('Dashboard data exported successfully', 'success');
}

/**
 * Show dashboard insights
 */
function showInsights() {
  const { incomeData, taxData } = dashboardState;
  
  if (incomeData.length === 0) {
    showToast('Add some income entries to see insights', 'info');
    return;
  }
  
  // Calculate insights
  const totalIncome = incomeData.reduce((sum, item) => sum + (item.amount || 0), 0);
  const avgIncome = totalIncome / incomeData.length;
  const tdsSaved = incomeData
    .filter(item => item.tdsDeducted)
    .reduce((sum, item) => sum + (item.tdsAmount || 0), 0);
  const gstCollected = incomeData
    .filter(item => item.gstApplicable)
    .reduce((sum, item) => sum + (item.gstAmount || 0), 0);
  
  const insights = [
    `Average income per client: ${formatCurrency(avgIncome)}`,
    `TDS saved this year: ${formatCurrency(tdsSaved)}`,
    `GST collected this year: ${formatCurrency(gstCollected)}`,
    `Total clients: ${new Set(incomeData.map(item => item.clientName)).size}`,
    `Tax efficiency: ${calculatePercentage(tdsSaved, totalIncome)}%`
  ];
  
  // Show insights modal (simplified version with toast)
  insights.forEach((insight, index) => {
    setTimeout(() => {
      showToast(insight, 'info', 4000);
    }, index * 1000);
  });
}

/**
 * Add keyboard shortcuts for dashboard
 */
document.addEventListener('keydown', (e) => {
  // Only on dashboard page
  if (getCurrentPageName() !== 'dashboard') return;
  
  // R - Refresh
  if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    refreshDashboard();
  }
  
  // E - Export
  if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
    e.preventDefault();
    exportDashboardData();
  }
  
  // I - Insights
  if (e.key === 'i' && !e.ctrlKey && !e.metaKey) {
    e.preventDefault();
    showInsights();
  }
});

/**
 * Handle page visibility changes
 */
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && getCurrentPageName() === 'dashboard') {
    // Refresh data when page becomes visible
    refreshDashboard();
  }
});

/**
 * Cleanup function for dashboard
 */
export function cleanupDashboard() {
  // Destroy chart instances
  if (dashboardState.charts.income) {
    dashboardState.charts.income.destroy();
  }
  if (dashboardState.charts.tax) {
    dashboardState.charts.tax.destroy();
  }
  
  // Reset state
  dashboardState = {
    incomeData: [],
    taxData: null,
    user: null,
    isLoading: false,
    charts: {
      income: null,
      tax: null
    }
  };
}

/**
 * Get dashboard state (for other modules)
 */
export function getDashboardState() {
  return dashboardState;
}

/**
 * Update dashboard state
 */
export function updateDashboardState(updates) {
  dashboardState = { ...dashboardState, ...updates };
}

// Auto-cleanup when navigating away
window.addEventListener('beforeunload', cleanupDashboard);

// Make functions globally available for inline handlers
window.refreshDashboard = refreshDashboard;
window.exportDashboardData = exportDashboardData;
window.showInsights = showInsights;
