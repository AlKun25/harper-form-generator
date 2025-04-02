import { NextRequest, NextResponse } from 'next/server';
import type { CompanyMemory } from '@/types';

// Mock data for demonstration purposes
// In a real application, this would come from a database or external API
const companyMemories: CompanyMemory[] = [
  {
    companyId: '1',
    structuredData: {
      name: 'Acme Corporation',
      address: '123 Manufacturing Blvd',
      city: 'Industrial City',
      state: 'CA',
      zipCode: '90210',
      industry: 'Manufacturing',
      employeeCount: 1500,
      annualRevenue: 25000000,
      yearFounded: 1985,
      website: 'www.acmecorp.com',
      contactName: 'John Smith',
      contactEmail: 'john.smith@acmecorp.com',
      contactPhone: '(555) 123-4567'
    },
    unstructuredData: [
      {
        type: 'call_transcript',
        date: '2023-05-15',
        content: 'Call with John Smith from Acme Corporation. They are interested in a liability insurance policy with a $2,000,000 coverage limit. They prefer a $10,000 deductible. They have had 2 claims in the past 5 years. Their current premium is $45,000 per year.'
      },
      {
        type: 'email',
        date: '2023-05-20',
        content: 'Following up on our call, I would like to confirm that we need coverage to start by July 1st. Please let me know what additional information you need from us.'
      }
    ]
  },
  {
    companyId: '2',
    structuredData: {
      name: 'TechStream Solutions',
      address: '456 Innovation Way',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      industry: 'Technology',
      employeeCount: 350,
      annualRevenue: 75000000,
      yearFounded: 2015,
      website: 'www.techstreamsolutions.com',
      contactName: 'Sarah Johnson',
      contactEmail: 'sarah.j@techstream.com',
      contactPhone: '(555) 987-6543'
    },
    unstructuredData: [
      {
        type: 'call_transcript',
        date: '2023-06-10',
        content: 'Call with Sarah Johnson from TechStream Solutions. They need cyber insurance coverage due to recent industry data breaches. Looking for $5,000,000 in coverage with a $25,000 deductible. They have implemented advanced security measures in the last year and have had no security incidents.'
      }
    ]
  },
  {
    companyId: '3',
    structuredData: {
      name: 'Global Logistics Inc.',
      address: '789 Transport Road',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60603',
      industry: 'Transportation',
      employeeCount: 2300,
      annualRevenue: 120000000,
      yearFounded: 1978,
      website: 'www.globallogistics.com',
      contactName: 'Michael Chen',
      contactEmail: 'mchen@globallogistics.com',
      contactPhone: '(555) 555-1212'
    },
    unstructuredData: [
      {
        type: 'call_transcript',
        date: '2023-07-05',
        content: 'Call with Michael Chen from Global Logistics. They need to renew their fleet insurance policy. They have added 15 new trucks in the past year, bringing their total to 250 vehicles. They have had 3 minor accidents in the past year with total claims of approximately $85,000. They are requesting a policy with a $50,000 deductible and are hoping to keep the premium under $500,000.'
      },
      {
        type: 'note',
        date: '2023-07-10',
        content: 'Michael mentioned that they are expanding operations to Canada next quarter and will need to discuss international coverage options.'
      }
    ]
  },
  {
    companyId: '4',
    structuredData: {
      name: 'Evergreen Healthcare',
      address: '101 Wellness Avenue',
      city: 'Boston',
      state: 'MA',
      zipCode: '02109',
      industry: 'Healthcare',
      employeeCount: 750,
      annualRevenue: 45000000,
      yearFounded: 2005,
      website: 'www.evergreenhealthcare.org',
      contactName: 'Dr. Lisa Wong',
      contactEmail: 'lwong@evergreen.org',
      contactPhone: '(555) 222-3333'
    },
    unstructuredData: [
      {
        type: 'call_transcript',
        date: '2023-08-12',
        content: 'Call with Dr. Lisa Wong from Evergreen Healthcare. They are looking for malpractice insurance for their new facility opening in October. They will have 25 doctors and 50 nurses on staff. They have a strong risk management program and have not had any malpractice claims in the past 3 years. They would like a policy with a $3,000,000 coverage limit and a $100,000 deductible.'
      }
    ]
  },
  {
    companyId: '5',
    structuredData: {
      name: 'Financial Experts Group',
      address: '222 Wall Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10005',
      industry: 'Finance',
      employeeCount: 175,
      annualRevenue: 30000000,
      yearFounded: 2010,
      website: 'www.financialexperts.com',
      contactName: 'Robert Miller',
      contactEmail: 'rmiller@financialexperts.com',
      contactPhone: '(555) 444-5555'
    },
    unstructuredData: [
      {
        type: 'call_transcript',
        date: '2023-09-01',
        content: 'Call with Robert Miller from Financial Experts Group. They need professional liability insurance and errors & omissions coverage. Due to the sensitive nature of their work, they want a $10,000,000 coverage limit with a $250,000 deductible. They have had one claim in the past 7 years that was settled for $175,000.'
      },
      {
        type: 'email',
        date: '2023-09-05',
        content: 'We would like the policy to be effective from October 1st. Our current premium is $275,000 but we understand that the market has changed. We are willing to accept up to a 15% increase if necessary.'
      }
    ]
  }
];

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

    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 700));
    
    const memory = companyMemories.find(m => m.companyId === companyId);
    
    if (!memory) {
      return NextResponse.json(
        { success: false, error: 'Company memory not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      data: memory 
    });
  } catch (error) {
    console.error('Error fetching company memory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch company memory' },
      { status: 500 }
    );
  }
} 