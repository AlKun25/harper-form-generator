import { NextResponse } from 'next/server';
import type { Company } from '@/types';

// Mock data for demonstration purposes
// In a real application, this would come from a database or external API
const companies: Company[] = [
  {
    id: '1',
    name: 'Acme Corporation',
    industry: 'Manufacturing'
  },
  {
    id: '2',
    name: 'TechStream Solutions',
    industry: 'Technology'
  },
  {
    id: '3',
    name: 'Global Logistics Inc.',
    industry: 'Transportation'
  },
  {
    id: '4',
    name: 'Evergreen Healthcare',
    industry: 'Healthcare'
  },
  {
    id: '5',
    name: 'Financial Experts Group',
    industry: 'Finance'
  }
];

export async function GET() {
  try {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return NextResponse.json({ 
      success: true,
      data: companies 
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
} 