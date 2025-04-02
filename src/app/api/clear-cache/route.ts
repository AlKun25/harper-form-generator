import { NextRequest, NextResponse } from 'next/server';

// Access the form generation cache (in a real app, you would use a proper shared cache)
declare global {
  var formCache: Map<string, any> | undefined;
}

export async function POST(request: NextRequest) {
  try {
    // Get company ID from request body (optional)
    const body = await request.json().catch(() => ({}));
    const companyId = body.companyId;
    
    // If company ID is specified, clear only that entry
    if (companyId) {
      if (global.formCache) {
        const deleted = global.formCache.delete(companyId);
        console.log(`Cleared cache for company ID: ${companyId}, success: ${deleted}`);
        return NextResponse.json({ 
          success: true, 
          message: `Cache entry for company ID ${companyId} cleared`, 
          deleted 
        });
      } else {
        console.log('No cache exists yet to clear specific company');
        return NextResponse.json({ 
          success: true, 
          message: 'No cache exists yet' 
        });
      }
    }
    
    // Otherwise, clear all cache
    if (global.formCache) {
      const count = global.formCache.size;
      global.formCache.clear();
      console.log(`Cleared entire form cache with ${count} entries`);
      return NextResponse.json({ 
        success: true, 
        message: `Cleared entire form cache with ${count} entries` 
      });
    } else {
      console.log('No cache exists yet to clear');
      return NextResponse.json({ 
        success: true, 
        message: 'No cache exists yet' 
      });
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to clear cache: ' + (error instanceof Error ? error.message : 'Unknown error') 
      },
      { status: 500 }
    );
  }
} 