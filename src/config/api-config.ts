/**
 * API Configuration
 * 
 * This file contains configuration for the API endpoints used by the application.
 * Change these values to point to different environments (dev, staging, prod).
 */

// Mock API server configuration
export const API_CONFIG = {
  // Base URL for the API server
  MOCK_API_BASE_URL: 'http://localhost:4000',
  
  // API endpoints
  ENDPOINTS: {
    // Company data endpoints
    COMPANIES: '/api/companies',
    COMPANY_MEMORY: (companyId: string) => `/api/memory/${companyId}`,
    GENERATE_FORM: (companyId: string) => `/api/generate-form/${companyId}`,
    
    // Health check endpoint
    HEALTH: '/health'
  },
  
  // API response timeout in milliseconds
  TIMEOUT: 10000
};

// Log environment variables in non-production environments
if (process.env.NODE_ENV !== 'production') {
  console.log('RETOOL_COMPANIES_API_KEY exists:', !!process.env.RETOOL_COMPANIES_API_KEY);
  console.log('RETOOL_MEMORY_API_KEY exists:', !!process.env.RETOOL_MEMORY_API_KEY);
}

// Get the Retool API keys - important to use directly from process.env each time
// to ensure we always get the current value in Next.js route handlers
const getRetoolCompaniesApiKey = () => {
  const apiKey = process.env.RETOOL_COMPANIES_API_KEY;
  if (!apiKey && process.env.NODE_ENV !== 'production') {
    console.warn('Warning: RETOOL_COMPANIES_API_KEY is not set in environment variables');
  }
  return apiKey || '';
};

const getRetoolMemoryApiKey = () => {
  const apiKey = process.env.RETOOL_MEMORY_API_KEY;
  if (!apiKey && process.env.NODE_ENV !== 'production') {
    console.warn('Warning: RETOOL_MEMORY_API_KEY is not set in environment variables');
  }
  return apiKey || '';
};

// Retool API configuration
export const RETOOL_API = {
  // Base URL for the Retool API
  BASE_URL: 'https://tatch.retool.com/url',
  
  // API endpoints
  ENDPOINTS: {
    COMPANIES: '/company-query',
    MEMORY_INTERVIEW: '/memory-interview'
  },
  
  // Get headers with the appropriate API key
  getHeaders: function(endpoint: 'COMPANIES' | 'MEMORY_INTERVIEW') {
    const apiKey = endpoint === 'COMPANIES' 
      ? getRetoolCompaniesApiKey() 
      : getRetoolMemoryApiKey();
      
    return {
      'Content-Type': 'application/json',
      'X-Workflow-Api-Key': apiKey
    };
  }
};

// Helper functions
export function getFullUrl(endpoint: string): string {
  return `${API_CONFIG.MOCK_API_BASE_URL}${endpoint}`;
}

export function getRetoolUrl(endpoint: string): string {
  return `${RETOOL_API.BASE_URL}${endpoint}`;
}

export default API_CONFIG; 