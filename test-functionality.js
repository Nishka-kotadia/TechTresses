/**
 * Comprehensive Functionality Test
 * Tests all major features of the TechTresses application
 */

const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  name: 'Test User',
  email: `test${Date.now()}@example.com`
};

// Utility function to make HTTP requests
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          resolve({ status: res.statusCode, data });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test functions
async function testHealthCheck() {
  console.log('🔍 Testing Health Check...');
  try {
    const response = await makeRequest('/api/health');
    if (response.status === 200 && response.data.success) {
      console.log('✅ Health Check - PASSED');
      return true;
    } else {
      console.log('❌ Health Check - FAILED:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Health Check - ERROR:', error.message);
    return false;
  }
}

async function testCreateUser() {
  console.log('🔍 Testing User Creation...');
  try {
    const response = await makeRequest('/api/create-user', 'POST', TEST_USER);
    if (response.status === 201 && response.data.success) {
      console.log('✅ User Creation - PASSED');
      console.log(`   User ID: ${response.data.data.userId}`);
      return response.data.data.userId;
    } else {
      console.log('❌ User Creation - FAILED:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ User Creation - ERROR:', error.message);
    return null;
  }
}

async function testIncomeEndpoints(userId) {
  console.log('🔍 Testing Income Endpoints...');
  
  if (!userId) {
    console.log('❌ Income Tests - SKIPPED (no user ID)');
    return false;
  }

  try {
    // Test adding income
    const incomeData = {
      clientName: 'Test Client',
      amount: 50000,
      tdsDeducted: true,
      gstApplicable: false,
      notes: 'Test income entry',
      userId: userId
    };

    const addResponse = await makeRequest('/api/income/addIncome', 'POST', incomeData);
    if (addResponse.status !== 201) {
      console.log('❌ Add Income - FAILED:', addResponse.data);
      return false;
    }

    const incomeId = addResponse.data.data._id;
    console.log('✅ Add Income - PASSED');

    // Test getting income
    const getResponse = await makeRequest(`/api/income/${userId}`);
    if (getResponse.status === 200 && getResponse.data.success) {
      console.log('✅ Get Income - PASSED');
      console.log(`   Found ${getResponse.data.data.length} income entries`);
    } else {
      console.log('❌ Get Income - FAILED:', getResponse.data);
      return false;
    }

    // Test income summary
    const summaryResponse = await makeRequest(`/api/income/summary/${userId}`);
    if (summaryResponse.status === 200 && summaryResponse.data.success) {
      console.log('✅ Income Summary - PASSED');
      console.log(`   Total Income: ₹${summaryResponse.data.data.totalIncome}`);
    } else {
      console.log('❌ Income Summary - FAILED:', summaryResponse.data);
      return false;
    }

    // Test updating income
    const updateData = { notes: 'Updated test income' };
    const updateResponse = await makeRequest(`/api/income/${incomeId}`, 'PUT', updateData);
    if (updateResponse.status === 200 && updateResponse.data.success) {
      console.log('✅ Update Income - PASSED');
    } else {
      console.log('❌ Update Income - FAILED:', updateResponse.data);
      return false;
    }

    // Test deleting income
    const deleteResponse = await makeRequest(`/api/income/${incomeId}`, 'DELETE');
    if (deleteResponse.status === 200 && deleteResponse.data.success) {
      console.log('✅ Delete Income - PASSED');
    } else {
      console.log('❌ Delete Income - FAILED:', deleteResponse.data);
      return false;
    }

    return true;
  } catch (error) {
    console.log('❌ Income Tests - ERROR:', error.message);
    return false;
  }
}

async function testTaxEndpoints(userId) {
  console.log('🔍 Testing Tax Endpoints...');
  
  if (!userId) {
    console.log('❌ Tax Tests - SKIPPED (no user ID)');
    return false;
  }

  try {
    // Test tax calculation
    const taxResponse = await makeRequest(`/api/tax/calculateTax?userId=${userId}`);
    if (taxResponse.status === 200 && taxResponse.data.success) {
      console.log('✅ Tax Calculation - PASSED');
      console.log(`   Total Income: ₹${taxResponse.data.data.totalIncome}`);
      console.log(`   Tax Payable: ₹${taxResponse.data.data.finalTaxPayable}`);
    } else {
      console.log('❌ Tax Calculation - FAILED:', taxResponse.data);
      return false;
    }

    // Test deductions
    const deductionsData = { income: 500000, expenses: {} };
    const deductionsResponse = await makeRequest('/api/tax/getDeductions', 'POST', deductionsData);
    if (deductionsResponse.status === 200 && deductionsResponse.data.success) {
      console.log('✅ Deductions Calculation - PASSED');
    } else {
      console.log('❌ Deductions Calculation - FAILED:', deductionsResponse.data);
      return false;
    }

    // Test next due date
    const dueDateResponse = await makeRequest(`/api/tax/nextDueDate?userId=${userId}`);
    if (dueDateResponse.status === 200 && dueDateResponse.data.success) {
      console.log('✅ Next Due Date - PASSED');
    } else {
      console.log('❌ Next Due Date - FAILED:', dueDateResponse.data);
      return false;
    }

    // Test regime comparison
    const regimeResponse = await makeRequest('/api/tax/regimeComparison?income=500000');
    if (regimeResponse.status === 200 && regimeResponse.data.success) {
      console.log('✅ Tax Regime Comparison - PASSED');
    } else {
      console.log('❌ Tax Regime Comparison - FAILED:', regimeResponse.data);
      return false;
    }

    return true;
  } catch (error) {
    console.log('❌ Tax Tests - ERROR:', error.message);
    return false;
  }
}

async function testInvoiceEndpoints(userId) {
  console.log('🔍 Testing Invoice Endpoints...');
  
  if (!userId) {
    console.log('❌ Invoice Tests - SKIPPED (no user ID)');
    return false;
  }

  try {
    // Test invoice calculation
    const invoiceData = {
      clientName: 'Test Client',
      amount: 50000,
      gstApplicable: true,
      tds: true,
      userId: userId
    };

    const calcResponse = await makeRequest('/api/invoice/calculate', 'POST', invoiceData);
    if (calcResponse.status === 200 && calcResponse.data.success) {
      console.log('✅ Invoice Calculation - PASSED');
    } else {
      console.log('❌ Invoice Calculation - FAILED:', calcResponse.data);
      return false;
    }

    // Test invoice preview
    const previewResponse = await makeRequest('/api/invoice/preview', 'POST', invoiceData);
    if (previewResponse.status === 200 && previewResponse.data.success) {
      console.log('✅ Invoice Preview - PASSED');
    } else {
      console.log('❌ Invoice Preview - FAILED:', previewResponse.data);
      return false;
    }

    // Test invoice templates
    const templatesResponse = await makeRequest('/api/invoice/templates');
    if (templatesResponse.status === 200 && templatesResponse.data.success) {
      console.log('✅ Invoice Templates - PASSED');
      console.log(`   Available templates: ${templatesResponse.data.data.length}`);
    } else {
      console.log('❌ Invoice Templates - FAILED:', templatesResponse.data);
      return false;
    }

    return true;
  } catch (error) {
    console.log('❌ Invoice Tests - ERROR:', error.message);
    return false;
  }
}

async function testFrontendAccess() {
  console.log('🔍 Testing Frontend Access...');
  
  try {
    // Test main page
    const mainResponse = await makeRequest('/');
    if (mainResponse.status === 200) {
      console.log('✅ Frontend Main Page - PASSED');
    } else {
      console.log('❌ Frontend Main Page - FAILED:', mainResponse.status);
      return false;
    }

    // Test static assets (CSS)
    const cssResponse = await makeRequest('/css/styles.css');
    if (cssResponse.status === 200) {
      console.log('✅ CSS Assets - PASSED');
    } else {
      console.log('❌ CSS Assets - FAILED:', cssResponse.status);
      return false;
    }

    // Test static assets (JS)
    const jsResponse = await makeRequest('/js/main-simple.js');
    if (jsResponse.status === 200) {
      console.log('✅ JavaScript Assets - PASSED');
    } else {
      console.log('❌ JavaScript Assets - FAILED:', jsResponse.status);
      return false;
    }

    return true;
  } catch (error) {
    console.log('❌ Frontend Tests - ERROR:', error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Comprehensive Functionality Tests');
  console.log('='.repeat(50));

  const results = {
    healthCheck: false,
    createUser: false,
    income: false,
    tax: false,
    invoice: false,
    frontend: false
  };

  let userId = null;

  try {
    // Run tests in order
    results.healthCheck = await testHealthCheck();
    
    if (results.healthCheck) {
      userId = await testCreateUser();
      results.createUser = !!userId;
      
      if (results.createUser) {
        results.income = await testIncomeEndpoints(userId);
        results.tax = await testTaxEndpoints(userId);
        results.invoice = await testInvoiceEndpoints(userId);
      }
    }
    
    results.frontend = await testFrontendAccess();

  } catch (error) {
    console.error('❌ Test suite failed with error:', error.message);
  }

  // Print summary
  console.log('\n📊 Test Results Summary');
  console.log('='.repeat(50));
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  for (const [test, passed] of Object.entries(results)) {
    const status = passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`${test.padEnd(15)}: ${status}`);
  }
  
  console.log('='.repeat(50));
  console.log(`Total: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Application is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the issues above.');
  }

  return passedTests === totalTests;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  testHealthCheck,
  testCreateUser,
  testIncomeEndpoints,
  testTaxEndpoints,
  testInvoiceEndpoints,
  testFrontendAccess
};
