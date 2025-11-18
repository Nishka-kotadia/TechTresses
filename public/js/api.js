/**
 * API Service Layer - Handles all backend communication
 * Provides a clean interface for making HTTP requests to the backend API
 */

class ApiService {
  constructor() {
    // Use same origin for integrated server
    this.baseURL = window.location.origin + '/api';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Generic request method with error handling
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: { ...this.defaultHeaders, ...options.headers },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await fetch(window.location.origin + '/api/health');
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }
}

/**
 * Income API Methods
 */
class IncomeApi {
  constructor(apiService) {
    this.api = apiService;
  }

  /**
   * Add new income entry
   */
  async addIncome(incomeData) {
    return this.api.post('/income/addIncome', incomeData);
  }

  /**
   * Get all income for a user
   */
  async getUserIncome(userId) {
    return this.api.get(`/income/${userId}`);
  }

  /**
   * Update income entry
   */
  async updateIncome(incomeId, incomeData) {
    return this.api.put(`/income/${incomeId}`, incomeData);
  }

  /**
   * Delete income entry
   */
  async deleteIncome(incomeId) {
    return this.api.delete(`/income/${incomeId}`);
  }

  /**
   * Get income summary
   */
  async getIncomeSummary(userId) {
    return this.api.get(`/income/summary/${userId}`);
  }
}

/**
 * Tax API Methods
 */
class TaxApi {
  constructor(apiService) {
    this.api = apiService;
  }

  /**
   * Calculate complete tax for user
   */
  async calculateTax(userId) {
    return this.api.get('/tax/calculateTax', { userId });
  }

  /**
   * Get deduction suggestions
   */
  async getDeductions(expenseData) {
    return this.api.post('/tax/getDeductions', expenseData);
  }

  /**
   * Get next due dates
   */
  async getNextDueDate(userId) {
    return this.api.get('/tax/nextDueDate', { userId });
  }

  /**
   * Compare tax regimes
   */
  async compareRegimes(income) {
    return this.api.get('/tax/regimeComparison', { income });
  }

  /**
   * Calculate advance tax
   */
  async calculateAdvanceTax(userId) {
    return this.api.get('/tax/advanceTax', { userId });
  }
}

/**
 * Invoice API Methods
 */
class InvoiceApi {
  constructor(apiService) {
    this.api = apiService;
  }

  /**
   * Generate PDF invoice
   */
  async generateInvoice(invoiceData) {
    const response = await fetch(`${this.api.baseURL}/invoice/generateInvoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData),
    });

    if (!response.ok) {
      throw new Error(`Invoice generation failed: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Get invoice preview
   */
  async getPreview(invoiceData) {
    return this.api.post('/invoice/preview', invoiceData);
  }

  /**
   * Calculate invoice amounts
   */
  async calculateInvoice(invoiceData) {
    return this.api.post('/invoice/calculate', invoiceData);
  }

  /**
   * Get invoice templates
   */
  async getTemplates() {
    return this.api.get('/invoice/templates');
  }
}

/**
 * User API Methods
 */
class UserApi {
  constructor(apiService) {
    this.api = apiService;
  }

  /**
   * Get user profile
   */
  async getProfile(userId) {
    return this.api.get(`/user/${userId}`);
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, profileData) {
    return this.api.put(`/user/${userId}`, profileData);
  }

  /**
   * Create new user
   */
  async createUser(userData) {
    return this.api.post('/user/create', userData);
  }
}

/**
 * Main API Service Instance
 */
const apiService = new ApiService();
const incomeApi = new IncomeApi(apiService);
const taxApi = new TaxApi(apiService);
const invoiceApi = new InvoiceApi(apiService);
const userApi = new UserApi(apiService);

/**
 * Mock Data Service (for demo purposes when backend is not available)
 */
class MockDataService {
  constructor() {
    this.mockUserId = 'demo-user-123';
    this.initializeMockData();
  }

  initializeMockData() {
    this.mockIncome = [
      {
        _id: '1',
        clientName: 'Tech Corp',
        amount: 50000,
        tdsDeducted: true,
        gstApplicable: false,
        notes: 'Website development project',
        date: '2024-01-15',
        userId: this.mockUserId,
        netAmount: 45000,
        tdsAmount: 5000,
        gstAmount: 0
      },
      {
        _id: '2',
        clientName: 'Design Studio',
        amount: 30000,
        tdsDeducted: false,
        gstApplicable: false,
        notes: 'UI/UX design services',
        date: '2024-02-10',
        userId: this.mockUserId,
        netAmount: 30000,
        tdsAmount: 0,
        gstAmount: 0
      },
      {
        _id: '3',
        clientName: 'Startup XYZ',
        amount: 75000,
        tdsDeducted: true,
        gstApplicable: true,
        notes: 'Mobile app development',
        date: '2024-03-05',
        userId: this.mockUserId,
        netAmount: 61500,
        tdsAmount: 7500,
        gstAmount: 13500
      }
    ];

    this.mockUser = {
      _id: this.mockUserId,
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

    this.mockTaxCalculation = {
      grossIncome: 155000,
      deductions: 150000,
      taxableIncome: 5000,
      totalTax: 250,
      effectiveRate: 0.16,
      slabs: [
        { range: '₹0 - ₹2.5L', rate: '0%', amount: 0 },
        { range: '₹2.5L - ₹5L', rate: '5%', amount: 250 }
      ],
      advanceTax: {
        june: 38,
        september: 113,
        december: 188,
        march: 250
      }
    };
  }

  async getMockIncome() {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.mockIncome), 300);
    });
  }

  async addMockIncome(incomeData) {
    const newIncome = {
      _id: Date.now().toString(),
      ...incomeData,
      userId: this.mockUserId,
      date: new Date().toISOString().split('T')[0],
      netAmount: this.calculateNetAmount(incomeData),
      tdsAmount: incomeData.tdsDeducted ? incomeData.amount * 0.1 : 0,
      gstAmount: incomeData.gstApplicable ? incomeData.amount * 0.18 : 0
    };
    this.mockIncome.push(newIncome);
    return new Promise(resolve => {
      setTimeout(() => resolve(newIncome), 300);
    });
  }

  async deleteMockIncome(incomeId) {
    this.mockIncome = this.mockIncome.filter(income => income._id !== incomeId);
    return new Promise(resolve => {
      setTimeout(() => resolve({ success: true }), 300);
    });
  }

  async getMockTaxCalculation() {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.mockTaxCalculation), 300);
    });
  }

  async getMockUser() {
    return new Promise(resolve => {
      setTimeout(() => resolve(this.mockUser), 300);
    });
  }

  calculateNetAmount(incomeData) {
    let netAmount = incomeData.amount;
    if (incomeData.tdsDeducted) {
      netAmount -= incomeData.amount * 0.1;
    }
    if (incomeData.gstApplicable) {
      netAmount += incomeData.amount * 0.18;
    }
    return netAmount;
  }
}

const mockDataService = new MockDataService();

/**
 * Unified API interface that tries real API first, falls back to mock data
 */
class UnifiedApi {
  constructor() {
    this.useMockData = false;
    this.checkBackendAvailability();
  }

  async checkBackendAvailability() {
    try {
      await apiService.healthCheck();
      this.useMockData = false;
      console.log('Backend API is available');
    } catch (error) {
      this.useMockData = true;
      console.log('Backend API not available, using mock data');
    }
  }

  async getIncome(userId) {
    if (this.useMockData) {
      return mockDataService.getMockIncome();
    }
    try {
      return await incomeApi.getUserIncome(userId);
    } catch (error) {
      console.warn('Falling back to mock data for income');
      return mockDataService.getMockIncome();
    }
  }

  async addIncome(incomeData) {
    if (this.useMockData) {
      return mockDataService.addMockIncome(incomeData);
    }
    try {
      return await incomeApi.addIncome(incomeData);
    } catch (error) {
      console.warn('Falling back to mock data for add income');
      return mockDataService.addMockIncome(incomeData);
    }
  }

  async deleteIncome(incomeId) {
    if (this.useMockData) {
      return mockDataService.deleteMockIncome(incomeId);
    }
    try {
      return await incomeApi.deleteIncome(incomeId);
    } catch (error) {
      console.warn('Falling back to mock data for delete income');
      return mockDataService.deleteMockIncome(incomeId);
    }
  }

  async calculateTax(userId) {
    if (this.useMockData) {
      return mockDataService.getMockTaxCalculation();
    }
    try {
      return await taxApi.calculateTax(userId);
    } catch (error) {
      console.warn('Falling back to mock data for tax calculation');
      return mockDataService.getMockTaxCalculation();
    }
  }

  async getUserProfile(userId) {
    if (this.useMockData) {
      return mockDataService.getMockUser();
    }
    try {
      return await userApi.getProfile(userId);
    } catch (error) {
      console.warn('Falling back to mock data for user profile');
      return mockDataService.getMockUser();
    }
  }

  async generateInvoice(invoiceData) {
    if (this.useMockData) {
      // For mock data, return a simulated PDF blob
      const pdfContent = `Invoice for ${invoiceData.clientName}\nAmount: ₹${invoiceData.amount}\nDescription: ${invoiceData.description}`;
      return new Blob([pdfContent], { type: 'application/pdf' });
    }
    try {
      return await invoiceApi.generateInvoice(invoiceData);
    } catch (error) {
      console.error('Invoice generation failed:', error);
      throw error;
    }
  }
}

// Export the unified API instance
const unifiedApi = new UnifiedApi();

// Export individual services for advanced usage
export {
  apiService,
  incomeApi,
  taxApi,
  invoiceApi,
  userApi,
  mockDataService,
  unifiedApi
};

// Default export for convenience
export default unifiedApi;
