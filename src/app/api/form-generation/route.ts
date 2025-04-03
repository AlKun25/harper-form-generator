import { NextRequest, NextResponse } from 'next/server';
import { mapMemoryToACORD125 } from '@/utils/acord125-mapper';
import { mapMemoryToACORD126 } from '@/utils/acord126-mapper';
import { ACORD125Form } from '@/types/acord125';
import { ACORD126Form } from '@/types/acord126';

export async function POST(request: NextRequest) {
  try {
    // Get company ID and form type from request body
    const body = await request.json();
    const { companyId, formType = 'acord125' } = body;

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Missing company ID in request body' },
        { status: 400 }
      );
    }
    
    console.log(`Generating ${formType} form for company ID: ${companyId}`);

    // Use a platform-agnostic approach for fetching from the same origin
    let memoryApiUrl;
    
    // In Node.js environment (server-side), we need absolute URLs for fetch
    if (process.env.NODE_ENV === 'production') {
      // For production: use API_BASE_URL environment variable 
      // Set this in your Render dashboard to your app's URL (e.g., https://your-app.onrender.com)
      if (process.env.API_BASE_URL) {
        memoryApiUrl = `${process.env.API_BASE_URL}/api/memory?companyId=${companyId}`;
      } else {
        // Fallback to same-origin request by parsing from the request
        // This approach should work on Render and other platforms
        const origin = request.headers.get('host') || request.headers.get('x-forwarded-host');
        const protocol = request.headers.get('x-forwarded-proto') || 'https';
        memoryApiUrl = `${protocol}://${origin}/api/memory?companyId=${companyId}`;
      }
    } else {
      // For development: use localhost
      memoryApiUrl = `http://localhost:3000/api/memory?companyId=${companyId}`;
    }
    
    console.log(`Fetching memory data from: ${memoryApiUrl}`);
    
    const memoryResponse = await fetch(memoryApiUrl, {
      headers: request.headers
    });
    
    if (!memoryResponse.ok) {
      console.error(`Memory API returned ${memoryResponse.status}: ${memoryResponse.statusText}`);
      try {
        const errorText = await memoryResponse.text();
        console.error('Error response from memory API:', errorText);
      } catch (e) {
        console.error('Could not read memory API error response');
      }
      
      return NextResponse.json(
        { success: false, error: `Memory API returned status: ${memoryResponse.status}` },
        { status: 502 }
      );
    }

    const memoryData = await memoryResponse.json();
    
    if (!memoryData.success) {
      return NextResponse.json(
        { success: false, error: memoryData.error || 'Failed to retrieve memory data' },
        { status: 500 }
      );
    }
    
    console.log('Memory API response structure:', JSON.stringify(Object.keys(memoryData), null, 2));
    
    // Check if we received a valid memory structure
    if (!memoryData.data) {
      console.warn('Memory API returned success but no data property found');
      return NextResponse.json(
        { success: false, error: 'Memory data is empty or invalid' },
        { status: 500 }
      );
    }
    
    // Log memory data structure 
    console.log('Memory data structure:', {
      hasCompany: !!memoryData.data.company,
      hasCompanyJson: !!memoryData.data.company?.json,
      hasCompanyData: !!memoryData.data.company?.json?.company,
      hasFacts: !!memoryData.data.facts || !!memoryData.data.company?.json?.facts,
      hasPhoneEvents: !!memoryData.data.phone_events || !!memoryData.data.company?.phone_events,
    });
    
    // Select and use the appropriate mapper based on formType
    try {
      let formData: ACORD125Form | ACORD126Form;
      
      if (formType.toLowerCase() === 'acord126') {
        formData = mapMemoryToACORD126(memoryData.data);
        console.log('Successfully mapped memory data to ACORD126 form');
      } else {
        // Default to ACORD125
        formData = mapMemoryToACORD125(memoryData.data);
        console.log('Successfully mapped memory data to ACORD125 form');
      }
      
      return NextResponse.json({
        success: true,
        data: formData,
        formType: formType.toLowerCase()
      });
    } catch (error) {
      console.error(`Error mapping memory data to ${formType} form:`, error);
      
      // Return partial data for debugging
      return NextResponse.json({
        success: false, 
        error: `Error mapping data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        partial_data: memoryData, // Include raw data for debugging
        formType: formType.toLowerCase()
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error generating form:', error);
    return NextResponse.json(
      { success: false, error: 'Form generation failed: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
} 