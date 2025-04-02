/**
 * Mock API Server Test Script
 * 
 * This script tests the mock API server to ensure all endpoints
 * and data structures are working correctly.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:4000';

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  failedTests: []
};

function trackTestResult(testName, passed, error = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
    testResults.failedTests.push({ name: testName, error });
  }
}

async function testHealthCheck() {
  console.log('\nTesting health check endpoint...');
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    console.log('✓ Health check passed');
    console.log('Response:', response.data);
    trackTestResult('Health Check', true);
  } catch (error) {
    console.error('✗ Health check failed:', error.message);
    trackTestResult('Health Check', false, error.message);
  }
}

async function testGetCompanies() {
  console.log('\nTesting get companies endpoint...');
  try {
    const response = await axios.get(`${API_BASE_URL}/api/companies`);
    console.log('✓ Get companies request successful');
    
    // Validate response structure
    if (!Array.isArray(response.data)) {
      throw new Error('Response is not an array');
    }
    
    // Check if we have the expected companies
    const expectedCompanies = ['Acme Corporation', 'Globex Industries', 'Stark Enterprises', 'Initech', 'Wayne Enterprises'];
    const foundCompanies = response.data.map(company => company.name);
    
    const missingCompanies = expectedCompanies.filter(company => !foundCompanies.includes(company));
    if (missingCompanies.length > 0) {
      throw new Error(`Missing expected companies: ${missingCompanies.join(', ')}`);
    }
    
    console.log('✓ Response structure validated');
    console.log('Found companies:', foundCompanies);
    trackTestResult('Get Companies', true);
  } catch (error) {
    console.error('✗ Get companies test failed:', error.message);
    trackTestResult('Get Companies', false, error.message);
  }
}

async function testGetCompanyMemory() {
  console.log('\nTesting get company memory endpoint...');
  
  // Test with Acme Corporation (ID: 1)
  try {
    const response = await axios.get(`${API_BASE_URL}/api/memory/1`);
    console.log('✓ Get company memory request successful');
    
    // Validate response structure
    if (!response.data.structured || !response.data.unstructured) {
      throw new Error('Response missing required sections');
    }
    
    // Validate structured data
    const requiredFields = ['companyName', 'industry', 'revenue', 'employeeCount', 'location'];
    const missingFields = requiredFields.filter(field => !response.data.structured[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Validate unstructured data
    if (!Array.isArray(response.data.unstructured)) {
      throw new Error('Unstructured data is not an array');
    }
    
    // Check for required transcript content
    const hasLiabilityTranscript = response.data.unstructured.some(item => 
      item.type === 'transcript' && 
      item.content.toLowerCase().includes('liability') && 
      item.content.toLowerCase().includes('coverage')
    );
    
    if (!hasLiabilityTranscript) {
      throw new Error('Missing liability coverage transcript');
    }
    
    console.log('✓ Response structure validated');
    console.log('Company:', response.data.structured.companyName);
    console.log('Transcripts:', response.data.unstructured.length);
    trackTestResult('Get Company Memory', true);
  } catch (error) {
    console.error('✗ Get company memory test failed:', error.message);
    trackTestResult('Get Company Memory', false, error.message);
  }
}

async function testErrorHandling() {
  console.log('\nTesting error handling...');
  let allPassed = true;
  let errorMessage = '';
  
  // Test with non-existent company ID
  try {
    await axios.get(`${API_BASE_URL}/api/memory/999`);
    console.error('✗ Should have returned 404 for non-existent company');
    allPassed = false;
    errorMessage += 'Failed to handle non-existent company (404)\n';
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('✓ 404 error handled correctly for non-existent company');
    } else {
      console.error('✗ Unexpected error response:', error.message);
      allPassed = false;
      errorMessage += `Unexpected error for non-existent company: ${error.message}\n`;
    }
  }
  
  // Test with invalid company ID
  try {
    await axios.get(`${API_BASE_URL}/api/memory/invalid`);
    console.error('✗ Should have returned 400 for invalid company ID');
    allPassed = false;
    errorMessage += 'Failed to handle invalid company ID (400)\n';
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✓ 400 error handled correctly for invalid company ID');
    } else {
      console.error('✗ Unexpected error response:', error.message);
      allPassed = false;
      errorMessage += `Unexpected error for invalid company ID: ${error.message}\n`;
    }
  }
  
  trackTestResult('Error Handling', allPassed, errorMessage || null);
}

async function testConflictData() {
  console.log('\nTesting conflict data generation...');
  
  try {
    // Generate conflict data for Acme Corporation
    const { generateConflictData } = require('./test-helpers/conflict-test-generator');
    const result = generateConflictData('1', '1_conflict');
    
    if (!result.success) {
      throw new Error(result.message);
    }
    
    console.log('✓ Conflict data generated successfully');
    
    // Verify the generated file exists
    const filePath = path.join(__dirname, 'data/memory', '1_conflict.json');
    if (!fs.existsSync(filePath)) {
      throw new Error('Conflict data file not created');
    }
    
    // Verify the file content
    const conflictData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Check for conflicting information
    const hasConflicts = conflictData.unstructured.some(item => 
      item.content.toLowerCase().includes('different from') ||
      item.content.toLowerCase().includes('reassessed') ||
      item.content.toLowerCase().includes('relocated')
    );
    
    if (!hasConflicts) {
      throw new Error('Generated data does not contain expected conflicts');
    }
    
    console.log('✓ Conflict data validated');
    
    // Clean up the test file
    fs.unlinkSync(filePath);
    console.log('✓ Test file cleaned up');
    trackTestResult('Conflict Data Generation', true);
  } catch (error) {
    console.error('✗ Conflict data test failed:', error.message);
    trackTestResult('Conflict Data Generation', false, error.message);
  }
}

function printTestSummary() {
  console.log('\n=== Test Summary ===');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  
  if (testResults.failed > 0) {
    console.log('\nFailed Tests:');
    testResults.failedTests.forEach(({ name, error }) => {
      console.log(`\n✗ ${name}:`);
      console.log(`  Error: ${error}`);
    });
  }
  
  console.log('\nOverall Status:', testResults.failed === 0 ? '✓ All tests passed!' : '✗ Some tests failed');
}

async function runAllTests() {
  console.log('Starting mock API server tests...\n');
  
  await testHealthCheck();
  await testGetCompanies();
  await testGetCompanyMemory();
  await testErrorHandling();
  await testConflictData();
  
  printTestSummary();
  
  // Exit with appropriate status code
  process.exit(testResults.failed === 0 ? 0 : 1);
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests
}; 