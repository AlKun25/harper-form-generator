import { NextRequest, NextResponse } from 'next/server';
import { RETOOL_API, getRetoolUrl } from '@/config/api-config';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    
    if (!companyId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing companyId parameter' 
        },
        { status: 400 }
      );
    }
    
    console.log(`Fetching memory data for company ID: ${companyId}`);
    
    // Call the Retool API for memory data
    const response = await fetch(getRetoolUrl(RETOOL_API.ENDPOINTS.MEMORY_INTERVIEW), {
      method: 'POST',
      headers: RETOOL_API.getHeaders('MEMORY_INTERVIEW'),
      body: JSON.stringify({ 
        company_id: companyId 
      })
    });
    
    if (!response.ok) {
      throw new Error(`Retool API returned ${response.status}: ${response.statusText}`);
    }
    
    const memoryData = await response.json();
    
    console.log(`Retrieved memory data for company ID: ${companyId}`);
    
    // Return the memory data in the expected format
    return NextResponse.json({
      success: true,
      data: memoryData
    });
  } catch (error) {
    console.error('Error fetching memory data:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 