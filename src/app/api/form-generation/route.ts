import { NextRequest, NextResponse } from 'next/server';
import { mapMemoryToACORD125 } from '@/utils/acord125-mapper';
import { mapMemoryToACORD126 } from '@/utils/acord126-mapper';
import { ACORD125Form } from '@/types/acord125';
import { ACORD126Form } from '@/types/acord126';

// Define constants to eliminate magic strings
const FORM_TYPES = {
  ACORD125: 'acord125',
  ACORD126: 'acord126'
} as const;

type FormType = typeof FORM_TYPES[keyof typeof FORM_TYPES];

// Matches the Memory interface used in acord125-mapper.ts and acord126-mapper.ts
interface MemoryData {
  data?: MemoryData;
  memory?: MemoryData;
  id?: string;
  company_id?: string;
  company_json?: any;
  facts?: any[];
  phone_events?: any[];
  company?: {
    json?: {
      company?: {
        id?: string;
        company_name?: string;
        company_primary_phone?: string;
        company_description?: string;
        company_naics_code?: string;
        company_sic_code?: string;
        company_legal_entity_type?: string;
        company_website?: string;
        company_industry?: string;
        company_sub_industry?: string;
        company_primary_email?: string;
        company_timezone?: string;
        company_street_address_1?: string;
        company_street_address_2?: string;
        company_city?: string;
        company_state?: string;
        company_postal_code?: string;
        insurance_types?: string[];
        company_annual_revenue_usd?: string;
        company_annual_payroll_usd?: string;
        company_sub_contractor_costs_usd?: string;
        company_full_time_employees?: number;
        company_part_time_employees?: number;
        company_years_in_business?: number;
        [key: string]: any;
      };
      contacts?: Array<{
        id?: string;
        company_id?: number;
        contact_first_name?: string;
        contact_last_name?: string;
        contact_primary_phone?: string;
        contact_primary_email?: string;
        contact_years_of_owner_experience?: number;
        [key: string]: any;
      }>;
      facts?: Array<{
        uuid?: string;
        content?: string;
        fact?: string;
        name?: string;
        source_node_name?: string;
        target_node_name?: string;
        created_at?: string;
        expired_at?: string | null;
        valid_at?: string | null;
        invalid_at?: string | null;
      }>;
    };
    phone_events?: {
      json?: any[] | any;
    };
    md?: string;
  };
  contacts?: any[];
  [key: string]: any;
}

/**
 * Constructs the API URL for memory data retrieval
 */
function getMemoryApiUrl(request: NextRequest, companyId: string): string {
  if (process.env.NODE_ENV === 'production') {
    // Use configured API base URL if available
    if (process.env.API_BASE_URL) {
      return `${process.env.API_BASE_URL}/api/memory?companyId=${companyId}`;
    }
    
    // Fallback to extracting from request headers
    const origin = request.headers.get('host') || request.headers.get('x-forwarded-host');
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    return `${protocol}://${origin}/api/memory?companyId=${companyId}`;
  }
  
  // Development environment
  return `http://localhost:3000/api/memory?companyId=${companyId}`;
}

/**
 * Fetches memory data from the memory API
 */
async function fetchMemoryData(request: NextRequest, companyId: string) {
  const memoryApiUrl = getMemoryApiUrl(request, companyId);
  console.log(`Fetching memory data from: ${memoryApiUrl}`);
  
  try {
    const response = await fetch(memoryApiUrl, { headers: request.headers });
    
    if (!response.ok) {
      const status = response.status;
      const statusText = response.statusText;
      let errorText = '';
      
      try {
        errorText = await response.text();
      } catch {
        errorText = 'Could not read error response';
      }
      
      console.error(`Memory API error: ${status} ${statusText}`, errorText);
      throw new Error(`Memory API returned status: ${status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to retrieve memory data');
    }
    
    if (!data.data) {
      throw new Error('Memory data is empty or invalid');
    }
    
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error; // Rethrow application errors
    }
    throw new Error('Failed to fetch memory data');
  }
}

/**
 * Maps memory data to the appropriate form format
 */
function mapDataToForm(memoryData: MemoryData, formType: FormType): ACORD125Form | ACORD126Form {
  if (formType === FORM_TYPES.ACORD126) {
    return mapMemoryToACORD126(memoryData);
  }
  return mapMemoryToACORD125(memoryData);
}

/**
 * Validates request body and extracts required parameters
 */
async function validateRequestBody(request: NextRequest): Promise<{ companyId: string; formType: FormType }> {
  const body = await request.json();
  const { companyId, formType = FORM_TYPES.ACORD125 } = body;
  
  if (!companyId) {
    throw new Error('Missing company ID in request body');
  }
  
  // Validate formType is supported
  if (formType !== FORM_TYPES.ACORD125 && formType !== FORM_TYPES.ACORD126) {
    throw new Error(`Unsupported form type: ${formType}`);
  }
  
  return { companyId, formType: formType as FormType };
}

/**
 * Sanitizes the form data to remove sensitive information before returning to client
 */
function sanitizeResponse(formData: ACORD125Form | ACORD126Form): ACORD125Form | ACORD126Form {
  // Create a deep copy to avoid modifying the original object
  const sanitized = JSON.parse(JSON.stringify(formData));
  
  // Remove any sensitive information
  if ('agency' in sanitized) {
    delete sanitized.agency?.contact_name;
  }
  
  // Remove any debug or internal fields that shouldn't be exposed
  delete sanitized.__debug;
  delete sanitized.__internal;
  delete sanitized.__raw;
  
  return sanitized;
}

/**
 * Handles form generation API requests
 */
export async function POST(request: NextRequest) {
  try {
    // Validate request and extract parameters
    const { companyId, formType } = await validateRequestBody(request);
    console.log(`Generating ${formType} form for company ID: ${companyId}`);
    
    // Fetch required data
    const memoryData = await fetchMemoryData(request, companyId);
    
    // Log structured data information for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.log('Memory data structure:', {
        hasCompany: !!memoryData.data.company,
        hasCompanyJson: !!memoryData.data.company?.json,
        hasCompanyData: !!memoryData.data.company?.json?.company,
        hasFacts: !!memoryData.data.facts || !!memoryData.data.company?.json?.facts,
        hasPhoneEvents: !!memoryData.data.phone_events || !!memoryData.data.company?.phone_events,
      });
    }
    
    // Map memory data to form data
    try {
      const formData = mapDataToForm(memoryData.data, formType);
      // Sanitize the form data before sending to client
      const sanitizedData = sanitizeResponse(formData);
      
      return NextResponse.json({
        success: true,
        data: sanitizedData,
        formType
      });
    } catch (error) {
      console.error(`Error mapping memory data to ${formType} form:`, error);
      
      // Return detailed error for debugging, but without exposing internal data
      return NextResponse.json({
        success: false, 
        error: `Error mapping data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        formType
      }, { status: 422 }); // Use 422 for data processing errors
    }
  } catch (error) {
    console.error('Error generating form:', error);
    
    // Determine appropriate error status
    let status = 500;
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    if (message.includes('Missing company ID')) {
      status = 400; // Bad request for missing parameters
    } else if (message.includes('Memory API returned status')) {
      status = 502; // Bad gateway for upstream API errors
    }
    
    return NextResponse.json(
      { success: false, error: `Form generation failed: ${message}` },
      { status }
    );
  }
} 