/**
 * Utility Functions - Common helper functions used across the application
 */

/**
 * Format currency in Indian format
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '₹0';
  
  const num = parseFloat(amount);
  if (isNaN(num)) return '₹0';
  
  // Format with Indian numbering system
  const formatted = num.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  
  return formatted;
}

/**
 * Format date to readable format
 */
export function formatDate(dateString) {
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
 * Format date with time
 */
export function formatDateTime(dateString) {
  if (!dateString) return '--';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '--';
  
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value, total) {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Animate number counting
 */
export function animateNumber(element, targetValue, duration = 1000, prefix = '', suffix = '') {
  const startValue = 0;
  const startTime = performance.now();
  
  function updateNumber(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function for smooth animation
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    const currentValue = startValue + (targetValue - startValue) * easeOutQuart;
    
    element.textContent = prefix + Math.round(currentValue).toLocaleString('en-IN') + suffix;
    
    if (progress < 1) {
      requestAnimationFrame(updateNumber);
    }
  }
  
  requestAnimationFrame(updateNumber);
}

/**
 * Debounce function to limit function calls
 */
export function debounce(func, wait) {
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
 * Throttle function to limit function calls
 */
export function throttle(func, limit) {
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
 * Show loading overlay
 */
export function showLoading(message = 'Loading...') {
  const overlay = document.getElementById('loadingOverlay');
  const messageElement = overlay.querySelector('p');
  messageElement.textContent = message;
  overlay.classList.add('active');
}

/**
 * Hide loading overlay
 */
export function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  overlay.classList.remove('active');
}

/**
 * Show toast notification
 */
export function showToast(message, type = 'success', duration = 3000) {
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
 * Get appropriate icon for toast type
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
 * Validate email format
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate PAN card format
 */
export function validatePAN(pan) {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan.toUpperCase());
}

/**
 * Validate GST number format
 */
export function validateGST(gst) {
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
  return gstRegex.test(gst.toUpperCase());
}

/**
 * Validate phone number (Indian)
 */
export function validatePhone(phone) {
  const phoneRegex = /^[+]?[91]?[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Generate random ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Deep clone object
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

/**
 * Calculate tax based on Indian tax slabs (New Regime)
 */
export function calculateIndianTax(income, deductions = 0) {
  const taxableIncome = Math.max(0, income - deductions);
  let tax = 0;
  
  // New Tax Regime FY 2024-25
  const slabs = [
    { min: 0, max: 250000, rate: 0 },
    { min: 250000, max: 500000, rate: 0.05 },
    { min: 500000, max: 750000, rate: 0.10 },
    { min: 750000, max: 1000000, rate: 0.15 },
    { min: 1000000, max: 1250000, rate: 0.20 },
    { min: 1250000, max: 1500000, rate: 0.25 },
    { min: 1500000, max: Infinity, rate: 0.30 }
  ];
  
  const appliedSlabs = [];
  
  for (const slab of slabs) {
    if (taxableIncome > slab.min) {
      const taxableInSlab = Math.min(taxableIncome, slab.max) - slab.min;
      const slabTax = taxableInSlab * slab.rate;
      tax += slabTax;
      
      if (slabTax > 0) {
        appliedSlabs.push({
          range: `₹${slab.min.toLocaleString('en-IN')} - ₹${slab.max === Infinity ? '∞' : slab.max.toLocaleString('en-IN')}`,
          rate: `${(slab.rate * 100).toFixed(0)}%`,
          amount: slabTax
        });
      }
    }
  }
  
  return {
    grossIncome: income,
    deductions: deductions,
    taxableIncome: taxableIncome,
    totalTax: tax,
    effectiveRate: taxableIncome > 0 ? (tax / taxableIncome) * 100 : 0,
    slabs: appliedSlabs
  };
}

/**
 * Calculate advance tax schedule
 */
export function calculateAdvanceTax(totalTax) {
  return {
    june: Math.round(totalTax * 0.15),
    september: Math.round(totalTax * 0.45),
    december: Math.round(totalTax * 0.75),
    march: Math.round(totalTax * 1.0)
  };
}

/**
 * Download file from blob
 */
export function downloadFile(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Get next tax due date
 */
export function getNextTaxDueDate() {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Advance tax due dates
  const dueDates = [
    { month: 5, day: 15, name: 'June 15' },    // June 15
    { month: 8, day: 15, name: 'September 15' }, // September 15
    { month: 11, day: 15, name: 'December 15' }, // December 15
    { month: 2, day: 15, name: 'March 15' }     // March 15 (next year)
  ];
  
  for (const dueDate of dueDates) {
    const dueDateObj = new Date(currentYear, dueDate.month, dueDate.day);
    if (dueDateObj > now) {
      return {
        date: dueDateObj,
        name: dueDate.name,
        daysUntil: Math.ceil((dueDateObj - now) / (1000 * 60 * 60 * 24))
      };
    }
  }
  
  // If all dates have passed this year, return next year's first date
  const nextYear = currentYear + 1;
  const firstDueDate = new Date(nextYear, 5, 15); // June 15 next year
  return {
    date: firstDueDate,
    name: 'June 15',
    daysUntil: Math.ceil((firstDueDate - now) / (1000 * 60 * 60 * 24))
  };
}

/**
 * Parse and validate form data
 */
export function parseFormData(form) {
  const formData = new FormData(form);
  const data = {};
  
  for (const [key, value] of formData.entries()) {
    // Handle checkboxes
    if (form.querySelector(`[name="${key}"][type="checkbox"]`)) {
      data[key] = form.querySelector(`[name="${key}"]`).checked;
    }
    // Handle numbers
    else if (form.querySelector(`[name="${key}"][type="number"]`)) {
      data[key] = parseFloat(value) || 0;
    }
    // Handle text
    else {
      data[key] = value.trim();
    }
  }
  
  return data;
}

/**
 * Set form data from object
 */
export function setFormData(form, data) {
  for (const [key, value] of Object.entries(data)) {
    const element = form.querySelector(`[name="${key}"]`);
    if (element) {
      if (element.type === 'checkbox') {
        element.checked = Boolean(value);
      } else {
        element.value = value || '';
      }
    }
  }
}

/**
 * Clear form validation errors
 */
export function clearFormErrors(form) {
  const errorElements = form.querySelectorAll('.error-message');
  errorElements.forEach(element => element.remove());
  
  const invalidInputs = form.querySelectorAll('.invalid');
  invalidInputs.forEach(input => input.classList.remove('invalid'));
}

/**
 * Show form validation error
 */
export function showFormError(input, message) {
  input.classList.add('invalid');
  
  const errorElement = document.createElement('div');
  errorElement.className = 'error-message';
  errorElement.textContent = message;
  errorElement.style.color = 'var(--error-color)';
  errorElement.style.fontSize = 'var(--font-size-sm)';
  errorElement.style.marginTop = 'var(--spacing-xs)';
  
  input.parentNode.appendChild(errorElement);
}

/**
 * Validate form
 */
export function validateForm(form, rules) {
  clearFormErrors(form);
  let isValid = true;
  
  for (const [fieldName, rule] of Object.entries(rules)) {
    const input = form.querySelector(`[name="${fieldName}"]`);
    if (!input) continue;
    
    const value = input.value.trim();
    
    // Required validation
    if (rule.required && !value) {
      showFormError(input, `${rule.label || fieldName} is required`);
      isValid = false;
      continue;
    }
    
    // Skip other validations if field is empty and not required
    if (!value && !rule.required) continue;
    
    // Type-specific validations
    if (rule.type === 'email' && !validateEmail(value)) {
      showFormError(input, 'Please enter a valid email address');
      isValid = false;
    }
    
    if (rule.type === 'pan' && !validatePAN(value)) {
      showFormError(input, 'Please enter a valid PAN number');
      isValid = false;
    }
    
    if (rule.type === 'gst' && !validateGST(value)) {
      showFormError(input, 'Please enter a valid GST number');
      isValid = false;
    }
    
    if (rule.type === 'phone' && !validatePhone(value)) {
      showFormError(input, 'Please enter a valid phone number');
      isValid = false;
    }
    
    // Min/Max validation
    if (rule.min && parseFloat(value) < rule.min) {
      showFormError(input, `Minimum value is ${rule.min}`);
      isValid = false;
    }
    
    if (rule.max && parseFloat(value) > rule.max) {
      showFormError(input, `Maximum value is ${rule.max}`);
      isValid = false;
    }
    
    // Custom validation
    if (rule.validate && !rule.validate(value)) {
      showFormError(input, rule.message || 'Invalid input');
      isValid = false;
    }
  }
  
  return isValid;
}

/**
 * Get current user ID (for demo purposes)
 */
export function getCurrentUserId() {
  return localStorage.getItem('userId') || '691bec955e1fb116f369d007';
}

/**
 * Set current user ID
 */
export function setCurrentUserId(userId) {
  localStorage.setItem('userId', userId);
}

/**
 * Get user preferences
 */
export function getUserPreferences() {
  const prefs = localStorage.getItem('userPreferences');
  return prefs ? JSON.parse(prefs) : {};
}

/**
 * Set user preferences
 */
export function setUserPreferences(preferences) {
  localStorage.setItem('userPreferences', JSON.stringify(preferences));
}

/**
 * Add CSS class with animation
 */
export function addClassWithAnimation(element, className, animationClass = 'fade-in') {
  element.classList.add(animationClass);
  setTimeout(() => {
    element.classList.remove(animationClass);
    element.classList.add(className);
  }, 300);
}

/**
 * Remove CSS class with animation
 */
export function removeClassWithAnimation(element, className, animationClass = 'fade-out') {
  element.classList.add(animationClass);
  setTimeout(() => {
    element.classList.remove(animationClass);
    element.classList.remove(className);
  }, 300);
}
