/**
 * Profile Management Page JavaScript
 * Handles user profile, settings, and preferences
 */

import { 
  showToast, 
  showLoading, 
  hideLoading,
  getCurrentUserId,
  parseFormData,
  validateForm,
  validateEmail,
  validatePAN,
  validateGST,
  validatePhone
} from './utils.js';
import { unifiedApi } from './api.js';

/**
 * Profile page state
 */
let profileState = {
  user: null,
  isLoading: false,
  activeTab: 'personal'
};

/**
 * Initialize profile page
 */
export async function initProfile() {
  try {
    console.log('Initializing profile page...');
    showLoading('Loading profile data...');
    
    // Load user data
    await loadUserData();
    
    // Setup forms
    setupProfileForm();
    setupBankForm();
    
    // Setup tabs
    setupProfileTabs();
    
    // Update UI
    updateProfileUI();
    updateBankUI();
    
    hideLoading();
    showToast('Profile loaded successfully', 'success');
    
  } catch (error) {
    hideLoading();
    console.error('Failed to initialize profile page:', error);
    showToast('Failed to load profile. Please try again.', 'error');
  }
}

/**
 * Load user data
 */
async function loadUserData() {
  const userId = getCurrentUserId();
  
  try {
    profileState.user = await unifiedApi.getUserProfile(userId);
  } catch (error) {
    console.error('Failed to load user data:', error);
    // Use default data for demo
    profileState.user = {
      _id: userId,
      name: 'John Doe',
      email: 'john@freelancer.com',
      phone: '+91 98765 43210',
      pan: 'ABCDE1234F',
      gstRegistered: false,
      gstNumber: null,
      bankName: 'State Bank of India',
      accountNumber: '1234567890123456',
      ifscCode: 'SBIN0001234',
      accountHolder: 'John Doe'
    };
  }
}

/**
 * Setup profile form handlers
 */
function setupProfileForm() {
  const form = document.getElementById('profileForm');
  if (!form) return;
  
  // Form submission
  form.addEventListener('submit', handleProfileSubmit);
  
  // Real-time validation
  const inputs = form.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('blur', () => validateProfileField(input));
    input.addEventListener('input', () => clearFieldError(input));
  });
  
  // GST registration toggle
  const gstCheckbox = form.querySelector('#gstRegistered');
  const gstNumberGroup = form.querySelector('#gstNumberGroup');
  
  if (gstCheckbox && gstNumberGroup) {
    gstCheckbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        gstNumberGroup.style.display = 'block';
      } else {
        gstNumberGroup.style.display = 'none';
        form.querySelector('#gstNumber').value = '';
      }
    });
  }
}

/**
 * Setup bank form handlers
 */
function setupBankForm() {
  const form = document.getElementById('bankForm');
  if (!form) return;
  
  // Form submission
  form.addEventListener('submit', handleBankSubmit);
  
  // Real-time validation
  const inputs = form.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('blur', () => validateBankField(input));
    input.addEventListener('input', () => clearFieldError(input));
  });
}

/**
 * Setup profile tabs
 */
function setupProfileTabs() {
  // Add tab navigation if not exists
  const profileSection = document.querySelector('.profile-section');
  if (!profileSection.querySelector('.profile-tabs')) {
    const tabsHTML = `
      <div class="profile-tabs">
        <button class="tab-btn active" data-tab="personal">
          <i class="fas fa-user"></i>
          Personal Information
        </button>
        <button class="tab-btn" data-tab="bank">
          <i class="fas fa-university"></i>
          Bank Details
        </button>
        <button class="tab-btn" data-tab="settings">
          <i class="fas fa-cog"></i>
          Settings
        </button>
      </div>
    `;
    
    profileSection.insertBefore(tabsHTML, profileSection.querySelector('.profile-form'));
    
    // Add tab click handlers
    const tabButtons = profileSection.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        switchTab(e.target.dataset.tab);
      });
    });
  }
  
  // Create settings tab content
  createSettingsTab();
}

/**
 * Create settings tab content
 */
function createSettingsTab() {
  const profileForm = document.querySelector('.profile-form');
  
  const settingsHTML = `
    <div class="form-card" id="settingsCard" style="display: none;">
      <h3>Application Settings</h3>
      <form id="settingsForm" class="form">
        <div class="form-group">
          <label for="currency">Default Currency</label>
          <select id="currency" name="currency">
            <option value="INR" selected>Indian Rupee (₹)</option>
            <option value="USD">US Dollar ($)</option>
            <option value="EUR">Euro (€)</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="language">Language</label>
          <select id="language" name="language">
            <option value="en" selected>English</option>
            <option value="hi">हिन्दी</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="notifications">Email Notifications</label>
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" id="emailNotifications" name="emailNotifications" checked>
              <span class="checkmark"></span>
              Tax reminders
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="invoiceNotifications" name="invoiceNotifications" checked>
              <span class="checkmark"></span>
              Invoice updates
            </label>
          </div>
        </div>
        
        <div class="form-group">
          <label for="theme">Theme</label>
          <div class="radio-group">
            <label class="radio-label">
              <input type="radio" name="theme" value="light" checked>
              <span class="radio-mark"></span>
              Light
            </label>
            <label class="radio-label">
              <input type="radio" name="theme" value="dark">
              <span class="radio-mark"></span>
              Dark
            </label>
          </div>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-save"></i>
            Save Settings
          </button>
        </div>
      </form>
      
      <div class="settings-section">
        <h4>Data Management</h4>
        <div class="settings-buttons">
          <button class="btn btn-secondary" onclick="exportAllData()">
            <i class="fas fa-download"></i>
            Export All Data
          </button>
          <button class="btn btn-danger" onclick="clearAllData()">
            <i class="fas fa-trash"></i>
            Clear All Data
          </button>
        </div>
      </div>
      
      <div class="settings-section">
        <h4>About</h4>
        <div class="about-info">
          <p><strong>Freelancer Tax Buddy</strong></p>
          <p>Version: 1.0.0</p>
          <p>© 2024 TaxBuddy. All rights reserved.</p>
          <div class="about-links">
            <a href="#" onclick="showPrivacyPolicy()">Privacy Policy</a>
            <a href="#" onclick="showTermsOfService()">Terms of Service</a>
            <a href="#" onclick="showSupport()">Support</a>
          </div>
        </div>
      </div>
    </div>
  `;
  
  profileForm.insertAdjacentHTML('beforeend', settingsHTML);
  
  // Setup settings form
  const settingsForm = document.getElementById('settingsForm');
  if (settingsForm) {
    settingsForm.addEventListener('submit', handleSettingsSubmit);
  }
}

/**
 * Switch profile tab
 */
function switchTab(tabName) {
  // Update active tab button
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    if (btn.dataset.tab === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // Show/hide corresponding content
  const profileCard = document.querySelector('.form-card:not(#settingsCard)');
  const bankCard = document.querySelector('.form-card:nth-child(2)');
  const settingsCard = document.getElementById('settingsCard');
  
  // Hide all cards first
  if (profileCard) profileCard.style.display = 'none';
  if (bankCard) bankCard.style.display = 'none';
  if (settingsCard) settingsCard.style.display = 'none';
  
  // Show selected tab
  switch (tabName) {
    case 'personal':
      if (profileCard) profileCard.style.display = 'block';
      break;
    case 'bank':
      if (bankCard) bankCard.style.display = 'block';
      break;
    case 'settings':
      if (settingsCard) settingsCard.style.display = 'block';
      break;
  }
  
  profileState.activeTab = tabName;
}

/**
 * Handle profile form submission
 */
async function handleProfileSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const formData = parseFormData(form);
  
  // Validate form
  const validationRules = {
    fullName: { required: true, min: 2, label: 'Full Name' },
    email: { required: true, type: 'email', label: 'Email' },
    phone: { required: true, type: 'phone', label: 'Phone' },
    pan: { required: true, type: 'pan', label: 'PAN Number' }
  };
  
  if (!validateForm(form, validationRules)) {
    showToast('Please fix errors in form', 'error');
    return;
  }
  
  // Additional GST validation if applicable
  if (formData.gstRegistered && formData.gstNumber) {
    if (!validateGST(formData.gstNumber)) {
      showToast('Please enter a valid GST number', 'error');
      return;
    }
  }
  
  try {
    showLoading('Updating profile...');
    
    // Update user profile
    const updatedUser = await unifiedApi.updateProfile(profileState.user._id, formData);
    
    // Update local state
    profileState.user = { ...profileState.user, ...updatedUser };
    
    // Update UI
    updateProfileUI();
    
    hideLoading();
    showToast('Profile updated successfully', 'success');
    
  } catch (error) {
    hideLoading();
    console.error('Failed to update profile:', error);
    showToast('Failed to update profile. Please try again.', 'error');
  }
}

/**
 * Handle bank form submission
 */
async function handleBankSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const formData = parseFormData(form);
  
  // Validate form
  const validationRules = {
    bankName: { required: true, min: 2, label: 'Bank Name' },
    accountNumber: { required: true, min: 10, label: 'Account Number' },
    ifscCode: { required: true, min: 11, max: 11, label: 'IFSC Code' },
    accountHolder: { required: true, min: 2, label: 'Account Holder Name' }
  };
  
  if (!validateForm(form, validationRules)) {
    showToast('Please fix errors in form', 'error');
    return;
  }
  
  try {
    showLoading('Updating bank details...');
    
    // Update user profile (bank details are part of profile)
    const updatedUser = await unifiedApi.updateProfile(profileState.user._id, formData);
    
    // Update local state
    profileState.user = { ...profileState.user, ...updatedUser };
    
    // Update UI
    updateBankUI();
    
    hideLoading();
    showToast('Bank details updated successfully', 'success');
    
  } catch (error) {
    hideLoading();
    console.error('Failed to update bank details:', error);
    showToast('Failed to update bank details. Please try again.', 'error');
  }
}

/**
 * Handle settings form submission
 */
async function handleSettingsSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const formData = parseFormData(form);
  
  try {
    showLoading('Saving settings...');
    
    // Save settings to localStorage
    localStorage.setItem('userSettings', JSON.stringify(formData));
    
    // Apply theme if changed
    if (formData.theme) {
      document.documentElement.setAttribute('data-theme', formData.theme);
    }
    
    hideLoading();
    showToast('Settings saved successfully', 'success');
    
  } catch (error) {
    hideLoading();
    console.error('Failed to save settings:', error);
    showToast('Failed to save settings. Please try again.', 'error');
  }
}

/**
 * Validate profile field
 */
function validateProfileField(input) {
  const value = input.value.trim();
  let isValid = true;
  let message = '';
  
  // Clear previous error
  clearFieldError(input);
  
  switch (input.name) {
    case 'fullName':
      if (!value) {
        isValid = false;
        message = 'Full name is required';
      } else if (value.length < 2) {
        isValid = false;
        message = 'Full name must be at least 2 characters';
      }
      break;
      
    case 'email':
      if (!value) {
        isValid = false;
        message = 'Email is required';
      } else if (!validateEmail(value)) {
        isValid = false;
        message = 'Please enter a valid email address';
      }
      break;
      
    case 'phone':
      if (!value) {
        isValid = false;
        message = 'Phone number is required';
      } else if (!validatePhone(value)) {
        isValid = false;
        message = 'Please enter a valid phone number';
      }
      break;
      
    case 'pan':
      if (!value) {
        isValid = false;
        message = 'PAN number is required';
      } else if (!validatePAN(value)) {
        isValid = false;
        message = 'Please enter a valid PAN number';
      }
      break;
  }
  
  if (!isValid) {
    showFieldError(input, message);
  }
  
  return isValid;
}

/**
 * Validate bank field
 */
function validateBankField(input) {
  const value = input.value.trim();
  let isValid = true;
  let message = '';
  
  // Clear previous error
  clearFieldError(input);
  
  switch (input.name) {
    case 'bankName':
      if (!value) {
        isValid = false;
        message = 'Bank name is required';
      } else if (value.length < 2) {
        isValid = false;
        message = 'Bank name must be at least 2 characters';
      }
      break;
      
    case 'accountNumber':
      if (!value) {
        isValid = false;
        message = 'Account number is required';
      } else if (value.length < 10) {
        isValid = false;
        message = 'Account number must be at least 10 digits';
      } else if (!/^\d+$/.test(value)) {
        isValid = false;
        message = 'Account number must contain only digits';
      }
      break;
      
    case 'ifscCode':
      if (!value) {
        isValid = false;
        message = 'IFSC code is required';
      } else if (value.length !== 11) {
        isValid = false;
        message = 'IFSC code must be 11 characters';
      } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(value)) {
        isValid = false;
        message = 'Please enter a valid IFSC code';
      }
      break;
      
    case 'accountHolder':
      if (!value) {
        isValid = false;
        message = 'Account holder name is required';
      } else if (value.length < 2) {
        isValid = false;
        message = 'Account holder name must be at least 2 characters';
      }
      break;
  }
  
  if (!isValid) {
    showFieldError(input, message);
  }
  
  return isValid;
}

/**
 * Show field error
 */
function showFieldError(input, message) {
  input.classList.add('invalid');
  
  const errorElement = document.createElement('div');
  errorElement.className = 'field-error';
  errorElement.textContent = message;
  errorElement.style.color = 'var(--error-color)';
  errorElement.style.fontSize = 'var(--font-size-sm)';
  errorElement.style.marginTop = 'var(--spacing-xs)';
  
  input.parentNode.appendChild(errorElement);
}

/**
 * Clear field error
 */
function clearFieldError(input) {
  input.classList.remove('invalid');
  
  const errorElement = input.parentNode.querySelector('.field-error');
  if (errorElement) {
    errorElement.remove();
  }
}

/**
 * Update profile UI
 */
function updateProfileUI() {
  const form = document.getElementById('profileForm');
  if (!form || !profileState.user) return;
  
  // Update form fields
  Object.entries(profileState.user).forEach(([key, value]) => {
    const input = form.querySelector(`[name="${key}"]`);
    if (input) {
      if (input.type === 'checkbox') {
        input.checked = Boolean(value);
      } else {
        input.value = value || '';
      }
    }
  });
  
  // Handle GST number visibility
  const gstCheckbox = form.querySelector('#gstRegistered');
  const gstNumberGroup = form.querySelector('#gstNumberGroup');
  
  if (gstCheckbox && gstNumberGroup) {
    if (gstCheckbox.checked) {
      gstNumberGroup.style.display = 'block';
    } else {
      gstNumberGroup.style.display = 'none';
    }
  }
}

/**
 * Update bank UI
 */
function updateBankUI() {
  const form = document.getElementById('bankForm');
  if (!form || !profileState.user) return;
  
  // Update form fields
  const bankFields = ['bankName', 'accountNumber', 'ifscCode', 'accountHolder'];
  bankFields.forEach(field => {
    const input = form.querySelector(`[name="${field}"]`);
    if (input && profileState.user[field]) {
      input.value = profileState.user[field] || '';
    }
  });
}

/**
 * Export all data
 */
function exportAllData() {
  if (!profileState.user) {
    showToast('No data to export', 'warning');
    return;
  }
  
  const exportData = {
    user: profileState.user,
    settings: JSON.parse(localStorage.getItem('userSettings') || '{}'),
    exportDate: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
    type: 'application/json' 
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `profile-data-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  showToast('Profile data exported successfully', 'success');
}

/**
 * Clear all data
 */
function clearAllData() {
  if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
    return;
  }
  
  try {
    showLoading('Clearing data...');
    
    // Clear localStorage
    localStorage.clear();
    
    // Reset forms
    const profileForm = document.getElementById('profileForm');
    const bankForm = document.getElementById('bankForm');
    const settingsForm = document.getElementById('settingsForm');
    
    if (profileForm) profileForm.reset();
    if (bankForm) bankForm.reset();
    if (settingsForm) settingsForm.reset();
    
    // Reset state
    profileState.user = null;
    
    hideLoading();
    showToast('All data cleared successfully', 'success');
    
    // Reload page after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
  } catch (error) {
    hideLoading();
    console.error('Failed to clear data:', error);
    showToast('Failed to clear data. Please try again.', 'error');
  }
}

/**
 * Show privacy policy
 */
function showPrivacyPolicy() {
  alert('Privacy Policy: This is a demo application. No personal data is actually stored or transmitted.');
}

/**
 * Show terms of service
 */
function showTermsOfService() {
  alert('Terms of Service: This is a demo application for hackathon purposes only.');
}

/**
 * Show support
 */
function showSupport() {
  alert('Support: This is a demo application. For support, please contact the development team.');
}

/**
 * Keyboard shortcuts
 */
document.addEventListener('keydown', (e) => {
  // Only on profile page
  if (getCurrentPageName() !== 'profile') return;
  
  // Ctrl/Cmd + S - Save profile
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    const activeForm = document.querySelector('.form-card:not([style*="display: none"]) form');
    if (activeForm) {
      activeForm.dispatchEvent(new Event('submit'));
    }
  }
  
  // Ctrl/Cmd + E - Export data
  if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
    e.preventDefault();
    exportAllData();
  }
});

// Make functions globally available
window.exportAllData = exportAllData;
window.clearAllData = clearAllData;
window.showPrivacyPolicy = showPrivacyPolicy;
window.showTermsOfService = showTermsOfService;
window.showSupport = showSupport;
