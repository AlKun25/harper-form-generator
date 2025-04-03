import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get pagination parameters from query string
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    
    // Mock company data
    const mockCompanies = [
      {
        id: "1",
        name: "Acme Construction Co.",
        industry: "Construction"
      },
      {
        id: "2",
        name: "TechSoft Solutions",
        industry: "Technology"
      },
      {
        id: "3",
        name: "Global Shipping Inc.",
        industry: "Transportation"
      },
      {
        id: "4",
        name: "Sunrise Healthcare",
        industry: "Healthcare"
      },
      {
        id: "5",
        name: "Metropolitan Insurance",
        industry: "Insurance"
      },
      {
        id: "123456",
        name: "Acme Construction Co.",
        industry: "Construction"
      }
    ];
    
    // Calculate pagination
    const totalItems = mockCompanies.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCompanies = mockCompanies.slice(startIndex, endIndex);
    
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
      { success: false, error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
} 