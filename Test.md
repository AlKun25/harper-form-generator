# Harper Form Generator - Testing Documentation

## 1. Overview

This document outlines the testing approach for the Harper Form Generator application, focusing on user journeys that cover both typical usage patterns and edge cases. Testing ensures that all features work correctly and that the application provides a smooth user experience.

## 2. Testing Environment Setup

### 2.1 Mock API Setup

The application relies on external APIs for company data and memory retrieval. For testing purposes, we use a mock API built with Flask:

1. Navigate to the `mock-api` directory
2. Set up a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On macOS/Linux
   venv\Scripts\activate     # On Windows
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the mock API server:
   ```bash
   python app.py
   ```
5. The mock API will run on `http://localhost:5000`

### 2.2 API Endpoints

- **Get Companies**: `GET /api/companies`
- **Get Company Memory**: `GET /api/memory/:company_id`
- **Health Check**: `GET /health`

### 2.3 Application Configuration

Configure the main application to use the mock API endpoints by updating the appropriate environment variables or service configuration files to point to `http://localhost:5000`.

## 3. Main User Journeys Testing

### 3.1 Standard Form Generation Journey

**Objective**: Verify that users can select a company, generate a pre-filled form, and download it.

**Setup**:
1. Start the mock API server
2. Ensure the application is configured to use mock API endpoints

**Test Steps**:
1. Log in to the application using Clerk authentication
   - Verify successful authentication
   - Verify redirect to the dashboard

2. Select "Acme Corporation" from the company list
   - Verify API call to `/api/companies` is made
   - Verify company selection UI updates correctly

3. Generate the form
   - Verify API call to `/api/memory/1` is made
   - Verify form is pre-filled with Acme Corporation's data:
     - Company Name: "Acme Corporation"
     - Industry: "Manufacturing"
     - Revenue: "$25M"
     - Employee Count: "250"
     - Liability Coverage: "$2M"
     - Deductible should be extracted from transcript text

4. Download the form
   - Verify PDF generation
   - Verify downloaded PDF contains correct data

**Expected Results**:
- Form fields are correctly populated with data from the structured and unstructured sources
- PDF download contains all form data in the correct format

### 3.2 Conversational Editing Journey

**Objective**: Verify that users can modify form fields using voice commands.

**Setup**:
1. Start the mock API server
2. Configure application to use mock API endpoints
3. Set up audio recording capabilities for testing

**Test Steps**:
1. Complete steps 1-3 from the Standard Form Generation Journey
2. Record or simulate voice command: "Update the deductible amount to $5,000"
   - Verify speech-to-text conversion
   - Verify deductible field updates to "$5,000"
   - Verify voice confirmation response
   
3. Record or simulate voice command: "Change the coverage limit to $3 million"
   - Verify speech-to-text conversion
   - Verify coverage limit field updates to "$3M"
   - Verify voice confirmation response

4. Record or simulate voice command: "Add a note that we need flood insurance for our Detroit facility"
   - Verify speech-to-text conversion
   - Verify note is added to the appropriate field
   - Verify voice confirmation response

5. Download the form
   - Verify PDF contains all voice-updated information

**Expected Results**:
- Voice commands are correctly interpreted
- Form updates in real-time with each modification
- System provides appropriate voice feedback
- Downloaded form contains all voice-updated information

### 3.3 Bonus Challenge: Form Extraction & Transposition Journey

**Objective**: Test the ability to extract data from an uploaded form and transpose it to a new template.

**Setup**:
1. Prepare a sample insurance form PDF with known data
2. Configure application for form extraction testing

**Test Steps**:
1. Log in to the application
2. Navigate to the form extraction feature
3. Upload the sample insurance form
   - Verify form upload success
   - Verify extraction process initialization
   
4. Review extracted data
   - Verify data accuracy against known values in sample form
   - Verify all required fields have been extracted
   
5. Select a target form template for transposition
   - Verify template loading
   - Verify field mapping display
   
6. Initiate data transposition
   - Verify mapping process
   - Verify completion notification
   
7. Download the new form
   - Verify PDF generation
   - Verify data has been correctly transposed to new template

**Expected Results**:
- System accurately extracts data from uploaded form
- Data is correctly mapped to new template
- Generated form contains all transposed data

## 4. Edge Case User Journeys Testing

### 4.1 Incomplete Data Journey

**Objective**: Test how the system handles companies with incomplete data.

**Setup**:
1. Create a modified version of a company memory file with missing fields
2. Configure the mock API to serve this incomplete data

**Test Steps**:
1. Log in to the application
2. Select the company with incomplete data
3. Generate the form
   - Verify the system identifies missing fields
   - Verify appropriate prompts for missing information
   
4. Provide missing information via voice: "The revenue is $15 million"
   - Verify missing field is updated
   
5. Download the completed form
   - Verify all fields are now populated

**Expected Results**:
- System identifies missing information
- System prompts user for required data
- Form is completed with user-provided information

### 4.2 Data Conflict Resolution Journey

**Objective**: Test how the system handles conflicting information.

**Setup**:
1. Create a modified company memory file with conflicting data points
2. Configure mock API to serve this conflicting data

**Test Steps**:
1. Log in to the application
2. Select the company with conflicting data
3. Generate the form
   - Verify the system identifies conflicts
   - Verify conflicts are presented to the user with clear options
   
4. Resolve conflicts via voice: "Use the more recent revenue figure of $30 million"
   - Verify conflict resolution
   - Verify form updates with resolved data
   
5. Download the form
   - Verify resolved data is in the final document

**Expected Results**:
- System identifies and highlights conflicting data
- User can resolve conflicts through voice interface
- Form updates with resolved information

### 4.3 Multi-Session Form Completion Journey

**Objective**: Test saving and resuming form progress across sessions.

**Test Steps**:
1. Log in to the application
2. Select a company and generate a form
3. Partially complete the form
4. Save progress
   - Verify save confirmation
   
5. Log out and close the browser
6. Log back in
7. Navigate to saved forms
   - Verify saved form is listed
   
8. Open the saved form
   - Verify all previously entered data is present
   
9. Complete remaining fields
10. Download the form
    - Verify all data is preserved

**Expected Results**:
- Form progress is saved correctly
- User can resume work from where they left off
- All data is preserved between sessions

### 4.4 Error Recovery Journey

**Objective**: Test system behavior when API failures occur.

**Setup**:
1. Configure the mock API to simulate failures on specific requests

**Test Steps**:
1. Log in to the application
2. Select a company
3. Trigger an API failure during form generation
   - Verify error message is displayed
   - Verify recovery options are presented
   
4. Select a recovery option (e.g., retry or switch to fallback mode)
   - Verify recovery process
   
5. Complete the form using the recovery path
6. Download the form

**Expected Results**:
- System displays user-friendly error messages
- System offers meaningful recovery options
- Users can complete tasks despite initial failures

### 4.5 Form Modification After Download Journey

**Objective**: Test reopening and modifying a previously downloaded form.

**Test Steps**:
1. Complete the Standard Form Generation Journey
2. Download the form
3. Navigate to the "Previous Forms" section
4. Reopen the downloaded form
   - Verify form loads with all previous data
   
5. Modify fields via voice: "Update the policy start date to January 1st, 2024"
   - Verify field updates
   
6. Download the updated form
   - Verify changes are reflected in new PDF

**Expected Results**:
- Previously generated forms can be reopened
- Voice modifications work on reopened forms
- Updated forms can be downloaded

### 4.6 Complex Voice Command Journey

**Objective**: Test system's ability to handle complex or ambiguous voice commands.

**Test Steps**:
1. Generate a form for "Wayne Enterprises" which has multiple facilities
2. Issue complex voice command: "Add all our warehouse locations to the form"
   - Verify system processes complex command
   - Verify system requests clarification if needed
   - Verify multiple form fields are updated appropriately
   
3. Issue ambiguous command: "Update all financial information to match last quarter's results"
   - Verify system seeks clarification
   - Verify appropriate fields are updated after clarification
   
4. Download the form
   - Verify complex command results are correctly reflected

**Expected Results**:
- System handles complex commands requiring multiple field updates
- System requests clarification for ambiguous commands
- All updates are correctly applied to the form

### 4.7 Form Template Switching Journey

**Objective**: Test ability to switch form templates while preserving data.

**Test Steps**:
1. Generate a form for a company
2. Fill out several fields
3. Navigate to template options
4. Select a different template
   - Verify data preservation confirmation dialog
   - Verify template switch process
   
5. Review the form with new template
   - Verify previously entered data is mapped to new fields
   - Verify fields unique to new template are empty
   
6. Download the form with new template
   - Verify PDF uses new template
   - Verify data is correctly positioned in new template

**Expected Results**:
- System allows template switching
- Data is preserved and correctly mapped to new template
- Unique fields in new template are properly handled

## 5. Automated Testing

### 5.1 Unit Tests for Voice Processing

```typescript
// Test: Complex voice command parsing
test('parses complex voice commands correctly', async () => {
  const command = "Add all our warehouse locations in Chicago, Detroit, and Cleveland to the form";
  
  // Mock LLM API response
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      action: "update_multiple",
      fields: ["warehouseLocations"],
      values: ["Chicago, IL; Detroit, MI; Cleveland, OH"],
      response: "I've added all warehouse locations to the form."
    })
  });
  
  const result = await processCommand(command, mockFormData);
  
  expect(result.action).toBe("update_multiple");
  expect(result.fields).toContain("warehouseLocations");
  expect(result.values[0]).toContain("Chicago, IL");
  expect(result.values[0]).toContain("Detroit, MI");
  expect(result.values[0]).toContain("Cleveland, OH");
});

// Test: Ambiguous command clarification
test('requests clarification for ambiguous commands', async () => {
  const command = "Update our financial information";
  
  // Mock LLM API response
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      action: "clarify",
      clarificationQuestion: "Which financial information would you like to update? Revenue, deductible, or coverage amount?",
      response: "I need more information. Which financial information would you like to update? Revenue, deductible, or coverage amount?"
    })
  });
  
  const result = await processCommand(command, mockFormData);
  
  expect(result.action).toBe("clarify");
  expect(result.clarificationQuestion).toContain("which financial information");
});
```

### 5.2 Integration Tests with Mock API

```typescript
// Test: Form generation with mock API data
test('generates form with data from mock API', async () => {
  // Mock API endpoints
  mockServer.use(
    rest.get('http://localhost:5000/api/companies', (req, res, ctx) => {
      return res(ctx.json(mockCompaniesData));
    }),
    rest.get('http://localhost:5000/api/memory/1', (req, res, ctx) => {
      return res(ctx.json(mockMemoryData));
    })
  );
  
  render(<FormGenerator />);
  
  // Select company
  await userEvent.click(screen.getByText('Select a Company'));
  await userEvent.click(screen.getByText('Acme Corporation'));
  
  // Wait for form to generate
  await waitFor(() => {
    expect(screen.getByDisplayValue('Acme Corporation')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Manufacturing')).toBeInTheDocument();
    expect(screen.getByDisplayValue('$25M')).toBeInTheDocument();
  });
  
  // Verify data from unstructured sources is extracted
  expect(screen.getByDisplayValue('$2M')).toBeInTheDocument(); // Liability coverage
});
```

### 5.3 Error Handling Tests

```typescript
// Test: API failure recovery
test('recovers from API failures', async () => {
  // Mock API failure then success
  let attemptCount = 0;
  mockServer.use(
    rest.get('http://localhost:5000/api/memory/1', (req, res, ctx) => {
      attemptCount++;
      if (attemptCount === 1) {
        return res(ctx.status(500), ctx.json({ error: 'Server error' }));
      }
      return res(ctx.json(mockMemoryData));
    })
  );
  
  render(<FormGenerator />);
  
  // Select company
  await userEvent.click(screen.getByText('Select a Company'));
  await userEvent.click(screen.getByText('Acme Corporation'));
  
  // Verify error is displayed
  await waitFor(() => {
    expect(screen.getByText(/error retrieving company data/i)).toBeInTheDocument();
  });
  
  // Click retry button
  await userEvent.click(screen.getByText('Retry'));
  
  // Verify form generates successfully on retry
  await waitFor(() => {
    expect(screen.getByDisplayValue('Acme Corporation')).toBeInTheDocument();
  });
});
```

### 5.4 Voice Interface Testing

```typescript
// Test: Speech-to-text conversion
test('converts speech to text accurately', async () => {
  // Create mock audio blob
  const mockAudioBlob = new Blob([], { type: 'audio/webm' });
  
  // Mock Deepgram API response
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      results: {
        channels: [{
          alternatives: [{
            transcript: "Update the deductible to five thousand dollars"
          }]
        }]
      }
    })
  });
  
  const result = await convertSpeechToText(mockAudioBlob);
  
  expect(result).toBe("Update the deductible to five thousand dollars");
});

// Test: Voice command with different speech patterns
test('handles different speech patterns', async () => {
  const speechVariations = [
    "Please update the deductible to five thousand",
    "Change deductible, make it five thousand",
    "Set the deductible at five thousand dollars",
    "Deductible should be five K"
  ];
  
  // Test each variation
  for (const speech of speechVariations) {
    // Mock speech-to-text conversion
    jest.spyOn(speechToTextService, 'convert').mockResolvedValue(speech);
    
    // Mock LLM intent analysis
    jest.spyOn(llmService, 'analyzeIntent').mockResolvedValue({
      action: "update",
      field: "deductible",
      value: "$5,000",
      response: `I've updated the deductible to $5,000.`
    });
    
    const result = await processVoiceCommand(new Blob());
    
    // Verify all speech variations result in the same field update
    expect(result.field).toBe("deductible");
    expect(result.value).toBe("$5,000");
  }
});
```

### 5.5 PDF Validation Tests

```typescript
// Test: PDF generation content validation
test('generates PDF with correct form data', async () => {
  // Create sample form data
  const formData = {
    companyName: "Acme Corporation",
    industry: "Manufacturing",
    revenue: "$25M",
    employeeCount: "250",
    liabilityCoverage: "$2M",
    deductible: "$5,000"
  };
  
  // Generate PDF
  const pdfBytes = await generatePDF(formData);
  
  // Convert PDF to text for validation
  const pdfText = await extractTextFromPDF(pdfBytes);
  
  // Verify all form fields appear in the PDF
  expect(pdfText).toContain("Acme Corporation");
  expect(pdfText).toContain("Manufacturing");
  expect(pdfText).toContain("$25M");
  expect(pdfText).toContain("250");
  expect(pdfText).toContain("$2M");
  expect(pdfText).toContain("$5,000");
});

// Helper function to extract text from PDF (for testing)
async function extractTextFromPDF(pdfBytes) {
  // In a real implementation, use a library like pdf.js or pdfjs-dist
  // This is a simplified version for illustration
  const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
  const pdf = await loadingTask.promise;
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    fullText += textContent.items.map(item => item.str).join(' ');
  }
  
  return fullText;
}
```

## 6. Performance Testing

### 6.1 Form Generation Performance

**Objective**: Measure time taken to extract and process company data for form generation.

**Test Setup**:
1. Configure performance monitoring
2. Prepare company data sets of varying sizes

**Test Steps**:
1. Measure baseline form generation time with Acme Corporation data
2. Measure form generation time with Wayne Enterprises (largest dataset)
3. Compare results against acceptable thresholds

**Performance Metrics**:
- Time to retrieve company data: < 500ms
- Time to extract form fields: < 2000ms
- Time to render completed form: < 500ms
- Total form generation time: < 3000ms

### 6.2 Voice Processing Latency

**Objective**: Measure end-to-end latency from voice input to form update.

**Test Steps**:
1. Record standard voice commands
2. Measure time from voice input to:
   - Speech-to-text completion
   - Intent processing completion
   - Form field update
   - Voice response playback

**Performance Metrics**:
- Speech-to-text conversion: < 1000ms
- Intent processing: < 1500ms
- Form update: < 200ms
- Voice response generation: < 1000ms
- End-to-end latency: < 3500ms

### 6.3 Load Testing

**Objective**: Verify system performance under high load conditions.

**Test Setup**:
1. Configure load testing tools (e.g., k6, Artillery)
2. Define load scenarios (e.g., concurrent users, request rates)

**Test Scenarios**:
1. **Moderate Load**: 50 concurrent users generating forms
2. **High Load**: 200 concurrent users generating forms
3. **Peak Load**: 500 concurrent users generating forms
4. **Sustained Load**: 100 concurrent users for 30 minutes

**Performance Metrics**:
- Response time under load: < 5000ms for 95th percentile
- Error rate: < 1% under high load
- Resource utilization (CPU, memory): < 80%
- Recovery time after load decreases: < 60 seconds

## 7. Security Testing

### 7.1 Authentication Testing

**Objective**: Verify that authentication mechanisms are secure.

**Test Steps**:
1. Attempt to access protected routes without authentication
2. Test authentication with invalid credentials
3. Test authentication token expiration handling
4. Verify proper session management

**Expected Results**:
- Unauthenticated users are redirected to login
- Invalid credentials result in appropriate error messages
- Expired tokens are handled gracefully
- Sessions are managed securely

### 7.2 Data Security Testing

**Objective**: Verify that sensitive company data is handled securely.

**Test Steps**:
1. Monitor network traffic during API calls
2. Inspect storage of company data in browser
3. Check handling of downloaded forms

**Expected Results**:
- All API calls use HTTPS
- Sensitive data is not stored in localStorage/sessionStorage
- Downloaded forms have appropriate access controls

### 7.3 API Security Testing

**Objective**: Ensure API endpoints are secure from common vulnerabilities.

**Test Steps**:
1. Test for authentication bypass
2. Attempt unauthorized access to company data
3. Test for SQL injection (if applicable)
4. Test for CSRF vulnerabilities
5. Verify proper rate limiting

**Expected Results**:
- API endpoints enforce proper authentication
- Company data is accessible only to authorized users
- API is protected against common injection attacks
- Rate limiting prevents abuse

## 8. Accessibility Testing

**Objective**: Verify that the application is accessible to users with disabilities.

**Test Steps**:
1. Test keyboard navigation throughout the application
2. Verify screen reader compatibility
3. Check color contrast for all UI elements
4. Test voice interface with various speech patterns

**Expected Results**:
- All functionality is accessible via keyboard
- Screen readers can interpret all content
- Color contrast meets WCAG 2.1 AA standards
- Voice interface works with diverse speech patterns

## 9. Cross-Browser and Device Testing

**Objective**: Ensure the application functions correctly across different browsers and devices.

**Test Matrix**:

| Browser/OS | Desktop | Tablet | Mobile |
|------------|---------|--------|--------|
| Chrome     | ✓       | ✓      | ✓      |
| Firefox    | ✓       | ✓      | ✓      |
| Safari     | ✓       | ✓      | ✓      |
| Edge       | ✓       | -      | -      |

**Test Steps**:
1. Complete the Standard Form Generation Journey on each browser/device combination
2. Test the voice interface on each supported browser/device
3. Verify PDF download functionality across platforms
4. Check responsive design and layout

**Expected Results**:
- Application functions consistently across all supported browsers and devices
- Voice interface works on all platforms with microphone support
- PDF generation and download works on all platforms
- UI is responsive and adapts appropriately to different screen sizes

## 10. End-to-End Testing Scenarios

### 10.1 Complete User Flow End-to-End Test

```typescript
// Using Playwright for end-to-end testing
import { test, expect } from '@playwright/test';

test('Complete user journey from login to form download', async ({ page }) => {
  // Start the mock API server (done in setup)
  
  // 1. Log in
  await page.goto('http://localhost:3000');
  await page.click('text=Sign In');
  await page.fill('[placeholder="Email"]', 'test@example.com');
  await page.fill('[placeholder="Password"]', 'password123');
  await page.click('button:has-text("Sign In")');
  
  // Verify successful login
  await expect(page).toHaveURL(/dashboard/);
  
  // 2. Select company
  await page.click('text=Select a Company');
  await page.click('text=Acme Corporation');
  
  // 3. Wait for form generation
  await expect(page.locator('[data-testid="form-container"]')).toBeVisible();
  await expect(page.locator('input[name="companyName"]')).toHaveValue('Acme Corporation');
  
  // 4. Modify form using voice interface (simulated)
  await page.click('[data-testid="voice-button"]');
  // Simulate voice command processing by directly calling the API
  await page.evaluate(() => {
    window.processVoiceCommand('Update the deductible to $5,000');
  });
  
  // Verify form update
  await expect(page.locator('input[name="deductible"]')).toHaveValue('$5,000');
  
  // 5. Download form
  const downloadPromise = page.waitForEvent('download');
  await page.click('text=Download Form');
  const download = await downloadPromise;
  
  // Verify download started
  expect(download.suggestedFilename()).toContain('Acme_Corporation');
  
  // 6. Verify PDF content (would require additional tooling in a real test)
});
```

### 10.2 Integration Test for Fallback Mechanisms

```typescript
test('System falls back to Gemini when OpenAI is unavailable', async ({ page }) => {
  // Configure mock API to simulate OpenAI outage
  await page.route('**/api/openai/**', route => route.abort());
  
  // Follow standard form generation journey
  await page.goto('http://localhost:3000');
  // (Login steps omitted for brevity)
  
  await page.click('text=Select a Company');
  await page.click('text=Acme Corporation');
  
  // Verify form is still generated using fallback AI
  await expect(page.locator('[data-testid="form-container"]')).toBeVisible();
  await expect(page.locator('input[name="companyName"]')).toHaveValue('Acme Corporation');
  
  // Verify fallback notification is displayed
  await expect(page.locator('[data-testid="fallback-notice"]')).toBeVisible();
  await expect(page.locator('[data-testid="fallback-notice"]')).toContainText('Using Gemini AI');
});
```

## 11. Testing Utilities

### 11.1 Mock Company Data Generator

The following utility can be used to generate variations of company data for testing:

```typescript
// src/test/utils/mockDataGenerator.ts

interface MockCompanyOptions {
  withMissingFields?: boolean;
  withConflictingData?: boolean;
  dataSize?: 'small' | 'medium' | 'large';
}

/**
 * Generates mock company data for testing purposes
 */
export function generateMockCompanyData(companyId: string, options: MockCompanyOptions = {}) {
  const baseData = {
    structured: {
      companyName: `Test Company ${companyId}`,
      industry: "Technology",
      yearFounded: 2000,
      revenue: "$10M",
      employeeCount: 100,
      location: {
        headquarters: "San Francisco, CA",
        facilities: ["San Francisco, CA", "Austin, TX"]
      },
      contactInfo: {
        primaryContact: "Jane Doe",
        position: "CEO",
        phone: "555-123-4567",
        email: "jane.doe@testcompany.example"
      }
    },
    unstructured: [
      {
        type: "transcript",
        date: "2023-01-15",
        content: "We need general liability coverage of $1M and a deductible of $10,000."
      }
    ]
  };
  
  // Generate data with missing fields
  if (options.withMissingFields) {
    delete baseData.structured.revenue;
    delete baseData.structured.yearFounded;
  }
  
  // Generate data with conflicting information
  if (options.withConflictingData) {
    baseData.unstructured.push({
      type: "transcript",
      date: "2023-02-20",
      content: "Our revenue last year was $15M, up from $10M the previous year."
    });
    baseData.unstructured.push({
      type: "transcript",
      date: "2023-03-05",
      content: "We currently need general liability coverage of $2M with a $5,000 deductible."
    });
  }
  
  // Add more data for large datasets
  if (options.dataSize === 'large') {
    // Add more facilities
    baseData.structured.location.facilities.push(
      "New York, NY", 
      "Chicago, IL", 
      "Miami, FL", 
      "Seattle, WA"
    );
    
    // Add more transcript data
    for (let i = 0; i < 20; i++) {
      baseData.unstructured.push({
        type: "transcript",
        date: `2023-${String(i % 12 + 1).padStart(2, '0')}-${String(i % 28 + 1).padStart(2, '0')}`,
        content: `This is transcript entry ${i + 1} with some random insurance-related information.`
      });
    }
  }
  
  return baseData;
}
```

### 11.2 Voice Command Simulator

To test the voice interface without actual microphone input:

```typescript
// src/test/utils/voiceCommandSimulator.ts

/**
 * Simulates voice commands for testing purposes
 */
export class VoiceCommandSimulator {
  /**
   * Simulates a voice command by bypassing the speech-to-text step
   */
  static async simulateCommand(command: string) {
    // Get reference to the voice processing service
    const voiceService = window.voiceProcessingService;
    
    // Directly invoke the text processing function
    const result = await voiceService.processText(command);
    
    // Apply the result to the form
    voiceService.applyCommandResult(result);
    
    return result;
  }
  
  /**
   * Simulates a sequence of voice commands
   */
  static async simulateConversation(commands: string[]) {
    const results = [];
    
    for (const command of commands) {
      const result = await this.simulateCommand(command);
      results.push(result);
      
      // Wait for UI updates
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return results;
  }
}
```

### 11.3 PDF Content Extractor for Testing

To validate the content of generated PDFs:

```typescript
// src/test/utils/pdfValidator.ts
import * as pdfjsLib from 'pdfjs-dist';

/**
 * Extracts text content from PDF for validation in tests
 */
export class PDFValidator {
  /**
   * Extracts text from PDF bytes
   */
  static async extractText(pdfBytes: Uint8Array): Promise<string> {
    // Set up PDF.js worker
    const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
    
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: pdfBytes });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  }
  
  /**
   * Validates that required fields are present in the PDF
   */
  static async validateFields(pdfBytes: Uint8Array, fields: Record<string, string>): Promise<boolean> {
    const text = await this.extractText(pdfBytes);
    
    // Check each field value is present in the PDF
    const results = Object.entries(fields).map(([field, value]) => {
      const isPresent = text.includes(value);
      if (!isPresent) {
        console.error(`Field validation failed: ${field} with value "${value}" not found in PDF`);
      }
      return isPresent;
    });
    
    // Return true only if all fields are present
    return results.every(result => result === true);
  }
}
```

## 12. Test Coverage Reporting

The testing strategy should maintain a minimum test coverage level:

- Unit Tests: >80% coverage
- Integration Tests: >70% coverage
- End-to-End Tests: All user journeys covered

Coverage reports should be generated after each test run and reviewed as part of the CI/CD pipeline.

## 13. Continuous Integration Setup

```yaml
# .github/workflows/test.yml
name: Run Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Set up Mock API
      run: |
        cd mock-api
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        python app.py &
        cd ..
        
    - name: Run unit and integration tests
      run: npm test
      
    - name: Run E2E tests
      run: npm run test:e2e
      
    - name: Generate coverage report
      run: npm run test:coverage
      
    - name: Upload coverage reports
      uses: actions/upload-artifact@v3
      with:
        name: coverage-report
        path: coverage/
``` 