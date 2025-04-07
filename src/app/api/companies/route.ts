import { NextRequest, NextResponse } from 'next/server';
import { RETOOL_API, getRetoolUrl } from '@/config/api-config';

// If needed, import API keys or config
// import { API_CONFIG } from '@/config/api-config';

export async function GET(request: NextRequest) {
  try {
    // Get pagination parameters from query string
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    
    console.log(`Fetching companies from Retool API: ${getRetoolUrl(RETOOL_API.ENDPOINTS.COMPANIES)}`);
    
    // Fetch companies from the Retool API
    const response = await fetch(getRetoolUrl(RETOOL_API.ENDPOINTS.COMPANIES), {
      method: 'POST',
      headers: RETOOL_API.getHeaders('COMPANIES'),
      body: JSON.stringify({}) // Empty body for POST request
    });
    
    if (!response.ok) {
      throw new Error(`Retool API returned ${response.status}: ${response.statusText}`);
    }
    
    const apiCompanies = await response.json();
    
    // Ensure we have an array
    const companiesArray = Array.isArray(apiCompanies) ? apiCompanies : [];
    
    console.log(`Retrieved ${companiesArray.length} companies from API`);
    
    // Transform to match the expected Company type and filter duplicates
    const uniqueCompanies = filterUniqueCompanies(companiesArray).map(company => ({
      id: company.id || '',
      name: company.company_name || company.name || 'Unknown Company',
      industry: company.industry || company.company_industry || ''
    }));
    
    // Calculate pagination
    const totalItems = uniqueCompanies.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCompanies = uniqueCompanies.slice(startIndex, endIndex);
    
    return NextResponse.json({ 
      success: true,
      data: paginatedCompanies,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasMore: page < totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch companies: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

/**
 * Filters out duplicate companies based on their ID
 */
function filterUniqueCompanies(companies: any[]): any[] {
  const uniqueMap = new Map();
  
  return companies.filter(company => {
    const id = company.id;
    if (!id) return true; // Keep entries without ID
    
    if (!uniqueMap.has(id)) {
      uniqueMap.set(id, true);
      return true;
    }
    return false;
  });
} 