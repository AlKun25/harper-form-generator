# Mock API Integration Guide

This document explains how the mock API server is integrated with the Next.js application.

## Overview

The Harper Form Generator application has been updated to use a mock API server for all company data and memory retrieval. This allows for:

1. Consistent test data across development environments
2. Easier testing of edge cases and error scenarios
3. Faster development without relying on external services
4. Better test coverage with predictable responses

## API Integration

The Next.js API routes have been updated to call the mock API server instead of using hardcoded data:

1. **Companies API**: `/api/companies` now calls the mock API server to get a list of companies.
2. **Memory API**: `/api/memory` now calls the mock API server to get company memory data.
3. **Form Generation API**: `/api/form-generation` now calls the mock API server to get company data and optionally generate a form.

## Configuration

The API endpoints are configured in `src/config/api-config.ts`, which contains:

- Base URL for the mock API server (default: `http://localhost:4000`)
- Endpoint paths for various API resources
- Helper functions for building full URLs

## Usage

1. Start the mock API server:
   ```bash
   cd mock-api
   source venv/bin/activate  # If not already activated
   npm start
   ```

2. In a different terminal, run the Next.js application:
   ```bash
   npm run dev
   ```

3. The application will now fetch data from the mock API server instead of using hardcoded data.

## Response Format Mapping

The mock API server returns data in a format that is slightly different from the format expected by the application. The API routes handle this mapping:

- Mock API returns `structured` and `unstructured` for company memory data
- Next.js API routes transform this to `structuredData` and `unstructuredData` for consistency with the application's type system

## Testing

To verify that the mock API integration is working correctly:

1. Run the mock API server tests:
   ```bash
   cd mock-api
   npm test
   ```

2. Check the console for the test summary, which shows passing and failing tests.

3. You can also manually test the integration by:
   - Using browser dev tools to inspect network calls from the frontend to the Next.js API routes
   - Using browser dev tools to inspect network calls from the Next.js API routes to the mock API server
   - Checking the response format to ensure it matches the expected structure

## Troubleshooting

- If the application cannot connect to the mock API, ensure the mock API server is running on port 4000
- If the data format seems incorrect, check the transformation logic in the API route handlers
- If changes to the mock API don't seem to be reflected, try restarting both the mock API server and the Next.js development server 