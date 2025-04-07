import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Only allow this in development mode
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { 
        success: false,
        error: 'Debug endpoint not available in production'
      },
      { status: 403 }
    );
  }

  // Check if important environment variables exist
  const envVars = {
    RETOOL_API_KEY: process.env.RETOOL_API_KEY ? 'exists' : 'missing',
    NODE_ENV: process.env.NODE_ENV,
    API_BASE_URL: process.env.API_BASE_URL
  };

  return NextResponse.json({
    success: true,
    envVars
  });
} 