import { NextResponse } from 'next/server';
import { ACORD126Form } from '@/types/acord126';

export async function POST(request: Request) {
  try {
    const formData: Partial<ACORD126Form> = await request.json();
    
    // Here you would typically:
    // 1. Validate the form data
    // 2. Save it to your database
    // 3. Return a success response
    
    console.log('Received ACORD126 form data:', formData);
    
    // Simulating database save delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return NextResponse.json({
      success: true,
      message: 'Form data saved successfully',
      data: formData
    });
  } catch (error) {
    console.error('Error saving ACORD126 form data:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 