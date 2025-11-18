/**
 * Main Application JavaScript
 * Handles navigation, routing, and app initialization
 */

// Import page modules
// These will be available as global functions from their respective files

/**
 * Main Application Class
 */
class TaxBuddyApp {
  constructor() {
    this.currentPage = 'dashboard';
    this.pages = new Map();
    this.isInitialized = false;
    
    // Bind methods
    this.handleNavigation = this.handleNavigation.bind(this);
    this.handleMobileMenu = this.handleMobileMenu.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      showLoading('Initializing application...');
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }

      // Initialize navigation
      this.initNavigation();
      
      // Initialize mobile menu
      this.initMobileMenu();
      
      // Register page modules
      this.registerPages();
      
      // Initialize current page
      await this.initCurrentPage();
      
      // Setup global event listeners
      this.setupGlobalEventListeners();
      
      // Check backend availability
      await this.checkBackendStatus();
      
      // Mark as initialized
      this.isInitialized = true;
      
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
  initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[data-page]');
    
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        this.navigateToPage(page);
      });
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', (e) => {
      const page = e.state?.page || 'dashboard';
      this.showPage(page, false);
    });
  }

  /**
   * Initialize mobile menu
   */
  initMobileMenu() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
      navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
      });

      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
          navToggle.classList.remove('active');
          navMenu.classList.remove('active');
        }
      });
    }
  }

  /**
   * Register page modules
   */
  registerPages() {
    this.pages.set('dashboard', initDashboard);
    this.pages.set('income', initIncome);
    this.pages.set('tax', initTax);
    this.pages.set('invoice', initInvoice);
    this.pages.set('profile', initProfile);
  }

  /**
   * Initialize current page based on URL or default
   */
  async initCurrentPage() {
    // Get page from URL hash or default to dashboard
    const hash = window.location.hash.slice(1);
    const page = hash && this.pages.has(hash) ? hash : 'dashboard';
    
    await this.navigateToPage(page, false);
  }

  /**
   * Navigate to a specific page
   */
  async navigateToPage(page, updateHistory = true) {
    if (!this.pages.has(page)) {
      console.error(`Page "${page}" not found`);
      return;
    }

    if (this.currentPage === page) {
      return; // Already on this page
    }

    try {
      showLoading(`Loading ${page}...`);
      
      // Hide current page
      await this.hideCurrentPage();
      
      // Show new page
      await this.showPage(page, updateHistory);
      
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
  async hideCurrentPage() {
    if (!this.currentPage) return;
    
    const currentPageElement = document.getElementById(this.currentPage);
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
  async showPage(page, updateHistory = true) {
    const pageElement = document.getElementById(page);
    if (!pageElement) {
      throw new Error(`Page element "${page}" not found`);
    }

    // Update navigation active state
    this.updateNavigation(page);
    
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
    
    // Initialize page module
    const pageInit = this.pages.get(page);
    if (pageInit) {
      await pageInit();
    }
    
    // Update current page
    this.currentPage = page;
    
    // Update browser history
    if (updateHistory) {
      const url = `#${page}`;
      window.history.pushState({ page }, '', url);
    }
  }

  /**
   * Update navigation active state
   */
  updateNavigation(activePage) {
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
   * Setup global event listeners
   */
  setupGlobalEventListeners() {
    // Handle window resize
    window.addEventListener('resize', throttle(this.handleResize, 250));
    
    // Handle online/offline status
    window.addEventListener('online', () => {
      showToast('Connection restored', 'success');
      this.checkBackendStatus();
    });
    
    window.addEventListener('offline', () => {
      showToast('Connection lost. Working offline.', 'warning');
    });

    // Handle escape key for mobile menu
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const navMenu = document.querySelector('.nav-menu');
        const navToggle = document.querySelector('.nav-toggle');
        
        if (navMenu && navMenu.classList.contains('active')) {
          navMenu.classList.remove('active');
          navToggle.classList.remove('active');
        }
      }
    });

    // Handle visibility change (tab switching)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isInitialized) {
        // Refresh data when tab becomes active
        this.refreshCurrentPage();
      }
    });
  }

  /**
   * Handle window resize
   */
  handleResize() {
    // Close mobile menu on desktop
    if (window.innerWidth > 768) {
      const navMenu = document.querySelector('.nav-menu');
      const navToggle = document.querySelector('.nav-toggle');
      
      if (navMenu && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
      }
    }
  }

  /**
   * Handle mobile menu toggle
   */
  handleMobileMenu(e) {
    const navToggle = e.target.closest('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
      navToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
    }
  }

  /**
   * Handle navigation clicks
   */
  handleNavigation(e) {
    const link = e.target.closest('.nav-link[data-page]');
    if (link) {
      e.preventDefault();
      const page = link.dataset.page;
      this.navigateToPage(page);
    }
  }

  /**
   * Check backend availability
   */
  async checkBackendStatus() {
    try {
      await unifiedApi.checkBackendAvailability();
      console.log('Backend is available');
    } catch (error) {
      console.log('Backend not available, using offline mode');
      showToast('Working in offline mode with demo data', 'info');
    }
  }

  /**
   * Refresh current page data
   */
  async refreshCurrentPage() {
    try {
      const pageInit = this.pages.get(this.currentPage);
      if (pageInit && typeof pageInit === 'function') {
        await pageInit();
      }
    } catch (error) {
      console.error('Failed to refresh page:', error);
    }
  }

  /**
   * Get current page name
   */
  getCurrentPage() {
    return this.currentPage;
  }

  /**
   * Check if app is initialized
   */
  isReady() {
    return this.isInitialized;
  }
}

/**
 * Global error handler
 */
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
  showToast('An unexpected error occurred. Please refresh the page.', 'error');
});

/**
 * Unhandled promise rejection handler
 */
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
  showToast('An unexpected error occurred. Please try again.', 'error');
  e.preventDefault();
});

/**
 * Initialize app when DOM is ready
 */
let app;

async function initializeApp() {
  try {
    app = new TaxBuddyApp();
    await app.init();
    
    // Make app instance globally available for debugging
    window.TaxBuddyApp = app;
    
  } catch (error) {
    console.error('Failed to start application:', error);
    showToast('Failed to start application. Please refresh the page.', 'error');
  }
}

// Start the app
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

/**
 * Export app instance for other modules
 */
export { app };

/**
 * Export navigation functions for other modules
 */
export function navigateToPage(page) {
  if (app) {
    return app.navigateToPage(page);
  }
}

export function getCurrentPageName() {
  if (app) {
    return app.getCurrentPage();
  }
}

/**
 * Utility functions for other modules
 */
export function showPageLoader(message = 'Loading...') {
  showLoading(message);
}

export function hidePageLoader() {
  hideLoading();
}

/**
 * Debounce and throttle utilities for other modules
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
 * Service Worker registration for PWA capabilities
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

/**
 * Performance monitoring
 */
if (window.performance && window.performance.mark) {
  // Mark app start time
  window.performance.mark('app-start');
  
  // Measure load time
  window.addEventListener('load', () => {
    window.performance.mark('app-loaded');
    window.performance.measure('app-load-time', 'app-start', 'app-loaded');
    
    const measure = window.performance.getEntriesByName('app-load-time')[0];
    console.log(`App loaded in ${measure.duration.toFixed(2)}ms`);
  });
}

/**
 * Keyboard shortcuts
 */
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + K for quick navigation
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    // TODO: Implement quick search/navigation
    showToast('Quick search coming soon!', 'info');
  }
  
  // Ctrl/Cmd + / for keyboard shortcuts help
  if ((e.ctrlKey || e.metaKey) && e.key === '/') {
    e.preventDefault();
    // TODO: Show keyboard shortcuts modal
    showToast('Keyboard shortcuts help coming soon!', 'info');
  }
});

/**
 * Theme support (for future implementation)
 */
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  // TODO: Implement theme toggle
}

// Initialize theme
initTheme();

/**
 * Analytics and error tracking (for future implementation)
 */
function trackPageView(page) {
  // TODO: Implement analytics
  console.log(`Page view: ${page}`);
}

function trackError(error, context = '') {
  // TODO: Implement error tracking
  console.error(`Error in ${context}:`, error);
}
