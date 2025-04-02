import { NextRequest, NextResponse } from 'next/server';
import { RETOOL_API, getRetoolUrl } from '@/config/api-config';
import { mapMemoryToACORD125 } from '@/utils/acord125-mapper';
import { ACORD125Form } from '@/types/acord125';

export async function POST(request: NextRequest) {
  try {
    // Get company ID from request body
    const body = await request.json();
    const companyId = body.companyId;

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Missing company ID in request body' },
        { status: 400 }
      );
    }
    
    console.log(`Generating form for company ID: ${companyId}`);

    // Fetch company memory from our memory API
    const memoryResponse = await fetch(`${request.nextUrl.origin}/api/memory?companyId=${companyId}`);
    
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
    
    // Map memory data to ACORD 125 form
    let formData: ACORD125Form;
    try {
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
      
      // Pass the actual memory data to the mapper
      formData = mapMemoryToACORD125(memoryData.data);
    } catch (error) {
      console.error('Error mapping memory data to ACORD 125 form:', error);
      
      // Return partial data for debugging
      return NextResponse.json({
        success: false, 
        error: `Error mapping data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        partial_data: memoryData // Include raw data for debugging
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: formData
    });
  } catch (error) {
    console.error('Error generating form:', error);
    return NextResponse.json(
      { success: false, error: 'Form generation failed: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
} 