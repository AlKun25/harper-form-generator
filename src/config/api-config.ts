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

// Retool API configuration
export const RETOOL_API = {
  // Base URL for the Retool API
  BASE_URL: 'https://tatch.retool.com/url',
  
  // API endpoints
  ENDPOINTS: {
    COMPANIES: '/company-query',
    MEMORY_INTERVIEW: '/memory-interview'
  },
  
  // API keys for different endpoints
  KEYS: {
    COMPANIES: 'retool_wk_aa1c5ac60ec3474bb52e8534aca1685b',
    MEMORY_INTERVIEW: 'retool_wk_dc0b4514fc4545d99d78175c985010bb'
  },
  
  // Get headers with the appropriate API key
  getHeaders: function(endpoint: keyof typeof this.KEYS) {
    return {
      'Content-Type': 'application/json',
      'X-Workflow-Api-Key': this.KEYS[endpoint] || this.KEYS.COMPANIES
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