/**
 * PDF Validator for Testing
 * 
 * This module provides utilities for validating the content of generated PDFs.
 * It uses the pdf.js library to extract text from PDFs for verification.
 */

const pdfjsLib = require('pdfjs-dist');
const fs = require('fs');
const path = require('path');

// Configure pdf.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(__dirname, '../../node_modules/pdfjs-dist/build/pdf.worker.js');

/**
 * Extract text from a PDF file
 * 
 * @param {string|Buffer} pdfPath Path to PDF file or PDF buffer
 * @returns {Promise<string>} Extracted text content
 */
async function extractTextFromPDF(pdfPath) {
  try {
    // Load PDF content
    let data;
    if (typeof pdfPath === 'string') {
      data = new Uint8Array(fs.readFileSync(pdfPath));
    } else {
      data = new Uint8Array(pdfPath);
    }
    
    // Parse PDF document
    const loadingTask = pdfjsLib.getDocument({ data });
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
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
  }
}

/**
 * Validate form fields in a PDF
 * 
 * @param {string|Buffer} pdfPath Path to PDF file or PDF buffer
 * @param {Object} expectedFields Map of field names to expected values
 * @returns {Promise<Object>} Validation results with success flag and details
 */
async function validatePDFFields(pdfPath, expectedFields) {
  try {
    const text = await extractTextFromPDF(pdfPath);
    const missingFields = [];
    
    // Check each field
    for (const [field, value] of Object.entries(expectedFields)) {
      if (!text.includes(value)) {
        missingFields.push({ field, value });
      }
    }
    
    return {
      success: missingFields.length === 0,
      text,
      missingFields
    };
  } catch (error) {
    console.error('Error validating PDF fields:', error);
    throw error;
  }
}

/**
 * Validate a form generated for a specific company
 * 
 * @param {string|Buffer} pdfPath Path to PDF file or PDF buffer
 * @param {string} companyId ID of the company to validate against
 * @returns {Promise<Object>} Validation results
 */
async function validateCompanyForm(pdfPath, companyId) {
  try {
    // Load company data from mock API
    const companyDataPath = path.join(__dirname, '../data/memory', `${companyId}.json`);
    const companyData = JSON.parse(fs.readFileSync(companyDataPath, 'utf8'));
    
    // Build expected fields based on company data
    const expectedFields = {
      companyName: companyData.structured.companyName,
      industry: companyData.structured.industry,
      revenue: companyData.structured.revenue,
      employeeCount: companyData.structured.employeeCount.toString(),
    };
    
    // Look for liability coverage in unstructured data
    const coverageTranscript = companyData.unstructured.find(t => 
      t.content.toLowerCase().includes('liability') && 
      t.content.toLowerCase().includes('coverage')
    );
    
    if (coverageTranscript) {
      const match = coverageTranscript.content.match(/\$\d+M/);
      if (match) {
        expectedFields.liabilityCoverage = match[0];
      }
    }
    
    return validatePDFFields(pdfPath, expectedFields);
  } catch (error) {
    console.error('Error validating company form:', error);
    throw error;
  }
}

module.exports = {
  extractTextFromPDF,
  validatePDFFields,
  validateCompanyForm
}; 