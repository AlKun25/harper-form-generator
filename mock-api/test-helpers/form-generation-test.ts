import { test, expect } from '@playwright/test';
import axios from 'axios';

/**
 * This file contains tests for the Standard Form Generation Journey
 */

test.describe('Standard Form Generation Journey', () => {
  // Mock API base URL
  const API_BASE_URL = 'http://localhost:5000';
  
  // Before each test, ensure the mock API is running
  test.beforeEach(async ({ page }) => {
    try {
      // Check if mock API is available
      await axios.get(`${API_BASE_URL}/health`);
    } catch (error) {
      test.fail(true, 'Mock API is not running. Please start the mock API server.');
    }
    
    // Configure the app to use the mock API
    // This would normally be done via environment variables or app config
    await page.goto('http://localhost:3000');
    await page.evaluate((apiUrl) => {
      window.localStorage.setItem('apiBaseUrl', apiUrl);
    }, API_BASE_URL);
    
    // Login process
    await page.goto('http://localhost:3000/sign-in');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForURL('**/dashboard');
  });
  
  test('should generate a pre-filled form for Acme Corporation', async ({ page }) => {
    // 1. Select company
    await page.click('[data-testid="company-select"]');
    await page.click('text=Acme Corporation');
    
    // 2. Wait for form to be generated
    await page.waitForSelector('[data-testid="insurance-form"]', { state: 'visible' });
    
    // 3. Verify form is pre-filled with correct data
    
    // Verify structured data
    await expect(page.locator('input[name="companyName"]')).toHaveValue('Acme Corporation');
    await expect(page.locator('input[name="industry"]')).toHaveValue('Manufacturing');
    await expect(page.locator('input[name="revenue"]')).toHaveValue('$25M');
    await expect(page.locator('input[name="employeeCount"]')).toHaveValue('250');
    await expect(page.locator('input[name="headquarters"]')).toHaveValue('Chicago, IL');
    
    // Verify data extracted from unstructured content
    await expect(page.locator('input[name="liabilityCoverage"]')).toHaveValue('$2M');
    
    // 4. Download the form
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-button"]');
    const download = await downloadPromise;
    
    // 5. Verify download started
    expect(download.suggestedFilename()).toContain('Acme_Corporation');
    expect(download.suggestedFilename()).toContain('.pdf');
  });
  
  test('should handle incomplete data gracefully', async ({ page }) => {
    // 1. Select company with incomplete data (would be set up in the mock API)
    await page.click('[data-testid="company-select"]');
    await page.click('text=Initech'); // Assuming Initech is configured with missing fields
    
    // 2. Wait for form to be generated
    await page.waitForSelector('[data-testid="insurance-form"]', { state: 'visible' });
    
    // 3. Verify missing field indicators are displayed
    await expect(page.locator('[data-testid="missing-field-indicator"]')).toBeVisible();
    
    // 4. Fill in missing data
    await page.fill('input[name="deductible"]', '$15,000');
    
    // 5. Verify missing field indicators are removed
    await expect(page.locator('[data-testid="missing-field-indicator"]')).not.toBeVisible();
    
    // 6. Download the completed form
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-button"]');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toContain('Initech');
  });
});

test.describe('Conversational Editing Journey', () => {
  // Mock API base URL
  const API_BASE_URL = 'http://localhost:5000';
  
  // Before each test, login and set up
  test.beforeEach(async ({ page }) => {
    try {
      // Check if mock API is available
      await axios.get(`${API_BASE_URL}/health`);
    } catch (error) {
      test.fail(true, 'Mock API is not running. Please start the mock API server.');
    }
    
    // Configure the app to use the mock API
    await page.goto('http://localhost:3000');
    await page.evaluate((apiUrl) => {
      window.localStorage.setItem('apiBaseUrl', apiUrl);
    }, API_BASE_URL);
    
    // Login process
    await page.goto('http://localhost:3000/sign-in');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForURL('**/dashboard');
    
    // Select company and generate form
    await page.click('[data-testid="company-select"]');
    await page.click('text=Acme Corporation');
    await page.waitForSelector('[data-testid="insurance-form"]', { state: 'visible' });
  });
  
  test('should update form using voice commands', async ({ page }) => {
    // Since we can't actually use a microphone in automated tests,
    // we can test the voice interface by injecting commands directly
    
    // 1. Simulate voice command to update deductible
    await page.evaluate(() => {
      // This assumes your app has a global function for testing voice commands
      window.testVoiceCommand('Update the deductible amount to $5,000');
    });
    
    // 2. Verify the form field was updated
    await expect(page.locator('input[name="deductible"]')).toHaveValue('$5,000');
    
    // 3. Simulate voice command to update coverage
    await page.evaluate(() => {
      window.testVoiceCommand('Change the coverage limit to $3 million');
    });
    
    // 4. Verify the form field was updated
    await expect(page.locator('input[name="liabilityCoverage"]')).toHaveValue('$3M');
    
    // 5. Simulate voice command to add a note
    await page.evaluate(() => {
      window.testVoiceCommand('Add a note that we need flood insurance for our Detroit facility');
    });
    
    // 6. Verify the note was added
    await expect(page.locator('textarea[name="additionalNotes"]')).toContainText('flood insurance for our Detroit facility');
    
    // 7. Download the updated form
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-button"]');
    await downloadPromise;
  });
  
  test('should handle ambiguous voice commands', async ({ page }) => {
    // 1. Simulate ambiguous voice command
    await page.evaluate(() => {
      window.testVoiceCommand('Update our financial information');
    });
    
    // 2. Verify clarification prompt appears
    await expect(page.locator('[data-testid="clarification-prompt"]')).toBeVisible();
    await expect(page.locator('[data-testid="clarification-prompt"]'))
      .toContainText('Which financial information would you like to update?');
    
    // 3. Respond to clarification
    await page.evaluate(() => {
      window.testVoiceCommand('Update the revenue to $30 million');
    });
    
    // 4. Verify form was updated after clarification
    await expect(page.locator('input[name="revenue"]')).toHaveValue('$30M');
  });
});

test.describe('Error Recovery Journey', () => {
  // Mock API base URL
  const API_BASE_URL = 'http://localhost:5000';
  
  test('should recover from API failures', async ({ page }) => {
    // Configure the mock API to fail on first attempt
    // This would be done by modifying the mock API behavior
    
    // 1. Login and navigate to dashboard
    await page.goto('http://localhost:3000/sign-in');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // 2. Select company (this will trigger an API failure)
    await page.click('[data-testid="company-select"]');
    await page.click('text=Acme Corporation');
    
    // 3. Verify error message is displayed
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    
    // 4. Click retry button
    await page.click('[data-testid="retry-button"]');
    
    // 5. Verify form loads successfully on retry
    await page.waitForSelector('[data-testid="insurance-form"]', { state: 'visible' });
    await expect(page.locator('input[name="companyName"]')).toHaveValue('Acme Corporation');
  });
  
  test('should fall back to Gemini when OpenAI is unavailable', async ({ page }) => {
    // Configure the app to simulate OpenAI being unavailable
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      window.localStorage.setItem('openai_available', 'false');
    });
    
    // Login and navigate to dashboard
    await page.goto('http://localhost:3000/sign-in');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Select company
    await page.click('[data-testid="company-select"]');
    await page.click('text=Acme Corporation');
    
    // Verify form is generated using fallback AI
    await page.waitForSelector('[data-testid="insurance-form"]', { state: 'visible' });
    
    // Verify fallback notice is visible
    await expect(page.locator('[data-testid="fallback-notice"]')).toBeVisible();
    await expect(page.locator('[data-testid="fallback-notice"]')).toContainText('Using Gemini AI');
  });
}); 