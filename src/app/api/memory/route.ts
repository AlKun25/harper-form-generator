import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    
    // This is mock data for demonstration
    const mockMemoryData = {
      company: {
        json: {
          company: {
            id: companyId || "123456",
            company_name: "Acme Construction Co.",
            company_primary_phone: "555-123-4567",
            company_description: "Commercial construction contractor specializing in retail spaces",
            company_naics_code: "23622",
            company_sic_code: "1542",
            company_legal_entity_type: "LLC",
            company_website: "https://acmeconstruction.example.com",
            company_industry: "Construction",
            company_sub_industry: "Commercial Building Construction",
            company_primary_email: "info@acmeconstruction.example.com",
            company_street_address_1: "123 Builder Way",
            company_street_address_2: "Suite 300",
            company_city: "Constructionville",
            company_state: "CA",
            company_postal_code: "90210",
            insurance_types: ["General Liability", "Workers Compensation"],
            company_annual_revenue_usd: "5000000",
            company_annual_payroll_usd: "1200000",
            company_sub_contractor_costs_usd: "750000",
            company_full_time_employees: 25,
            company_part_time_employees: 5,
            company_years_in_business: 12
          },
          contacts: [
            {
              id: "c001",
              company_id: companyId ? parseInt(companyId) : 123456,
              contact_first_name: "John",
              contact_last_name: "Builder",
              contact_primary_phone: "555-987-6543",
              contact_primary_email: "john@acmeconstruction.example.com",
              contact_years_of_owner_experience: 15
            }
          ],
          facts: [
            {
              uuid: "f001",
              fact: "Each occurrence limit is $1,000,000",
              name: "liability_limit",
              created_at: "2023-01-15T12:00:00Z"
            },
            {
              uuid: "f002",
              fact: "General aggregate limit is $2,000,000",
              name: "general_aggregate",
              created_at: "2023-01-15T12:00:00Z"
            },
            {
              uuid: "f003",
              fact: "Company subcontracts 30% of their work",
              name: "subcontract_percentage",
              created_at: "2023-01-15T12:00:00Z"
            },
            {
              uuid: "f004",
              fact: "They require certificates of insurance from all subcontractors",
              name: "certificates_required",
              created_at: "2023-01-15T12:00:00Z"
            },
            {
              uuid: "f005",
              fact: "Had a claim on 05/12/2022 for property damage, amount paid $25,000, claim is closed",
              name: "loss_history",
              created_at: "2023-01-15T12:00:00Z"
            }
          ]
        },
        phone_events: {
          json: [
            {
              event: "call",
              direction: "inbound",
              content: "Client mentioned they have a second location at address: 456 Construction Avenue, Builderville, CA 92101",
              created_at: "2023-01-10T15:30:00Z"
            },
            {
              event: "call",
              direction: "outbound",
              content: "Discussed additional coverage needs including $500,000 for damage to rented premises",
              created_at: "2023-01-12T10:15:00Z"
            }
          ]
        }
      }
    };
    
    // Return in the format expected by the company page
    return NextResponse.json({
      success: true,
      data: mockMemoryData
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