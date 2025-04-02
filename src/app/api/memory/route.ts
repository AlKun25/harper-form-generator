import { NextRequest, NextResponse } from 'next/server';
import { RETOOL_API, getRetoolUrl } from '@/config/api-config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Company ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`Fetching memory data for company ID: ${companyId}`);
    
    // Fetch company memory from the Retool API
    const response = await fetch(getRetoolUrl(RETOOL_API.ENDPOINTS.MEMORY_INTERVIEW), {
      method: 'POST',
      headers: RETOOL_API.getHeaders('MEMORY_INTERVIEW'),
      body: JSON.stringify({ company_id: companyId })
    });
    
    if (!response.ok) {
      let errorMessage = `API returned ${response.status}: ${response.statusText}`;
      try {
        const errorText = await response.text();
        console.error('Error response from memory API:', errorText);
        errorMessage += ` - ${errorText}`;
      } catch (e) {
        console.error('Could not read error response');
      }
      
      // For 404 responses, we'll check if there's still any usable data
      // If it's a proper 404 with no data, we'll handle it based on response content
      if (response.status === 404) {
        try {
          // Try to parse the response to see if it contains any memory data
          // Some APIs return 404 for the company but still include memory data
          const notFoundData = await response.clone().json();
          
          // Check if we have any useful memory data despite the 404
          if (notFoundData && (
              notFoundData.memory || 
              notFoundData.facts || 
              notFoundData.phone_events || 
              notFoundData.company?.phone_events
          )) {
            console.log("Found memory data despite 404 company status");
            return NextResponse.json({
              success: true,
              data: notFoundData,
              warning: "Company not found but memory data exists"
            });
          }
        } catch (parseError) {
          // If we can't parse the 404 response, just continue with the standard error
          console.error("Couldn't parse 404 response to check for memory:", parseError);
        }
        
        // Standard 404 handling if no memory data found
        return NextResponse.json(
          { success: false, error: 'Company memory not found' },
          { status: 404 }
        );
      }
      
      throw new Error(errorMessage);
    }
    
    let memory;
    try {
      memory = await response.json();
      console.log("Memory API returned structure:", Object.keys(memory));
    } catch (error) {
      console.error("Failed to parse memory API response:", error);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON response from API' },
        { status: 500 }
      );
    }
    
    // Ensure we have valid structure even if API returns unexpected format
    if (!memory) {
      memory = {};
    }
    
    return NextResponse.json({ 
      success: true,
      data: memory
    });
  } catch (error) {
    console.error('Error fetching company memory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch company memory: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
} 