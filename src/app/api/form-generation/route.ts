import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { InsuranceForm } from '@/types';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    // Get memory data from request
    const { memory } = await request.json();
    
    if (!memory) {
      return NextResponse.json(
        { success: false, error: 'Memory data is required' },
        { status: 400 }
      );
    }

    // Use OpenAI to extract structured data from the company memory
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-1106",
      messages: [
        {
          role: "system",
          content: "You are an AI that extracts structured data from unstructured text. The user will provide transcripts from a company. Extract the key information into a structured format."
        },
        {
          role: "user",
          content: `Extract the following information from these company transcripts and notes. Return ONLY a JSON object with these fields (use null if information is not available):
          {
            "name": "Company name",
            "address": "Street address",
            "city": "City",
            "state": "State",
            "zipCode": "Zip code",
            "industry": "Industry or business type",
            "employeeCount": number of employees,
            "annualRevenue": annual revenue in dollars (number only),
            "yearFounded": year the company was founded (number only),
            "contactName": "Primary contact name",
            "contactEmail": "Contact email",
            "contactPhone": "Contact phone number"
          }

          Here are the transcripts:
          ${JSON.stringify(memory)}
          `
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    // Extract the generated JSON data
    let structuredData;
    try {
      const messageContent = completion.choices[0].message.content || '{}';
      structuredData = JSON.parse(messageContent);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to parse AI-generated data' },
        { status: 500 }
      );
    }

    // Use the extracted data to create a pre-filled insurance form
    // Calculate some insurance-specific fields based on company data
    
    // Calculate coverage limit based on annual revenue and industry
    let coverageLimit = Math.min(structuredData.annualRevenue * 0.5, 10000000);
    
    // Round to nearest 100k
    coverageLimit = Math.round(coverageLimit / 100000) * 100000;
    
    // Deductible is typically 1-5% of coverage limit
    const deductibleAmount = Math.round(coverageLimit * 0.025 / 1000) * 1000;
    
    // Premium is typically 1-4% of coverage limit annually
    const premiumAmount = Math.round((coverageLimit * 0.015) / 100) * 100;
    
    // Set effective date as today and expiration as 1 year from now
    const currentDate = new Date();
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);
    
    // Add some relevant notes based on the company info
    const additionalNotes = `Based on ${structuredData.name}'s profile in the ${structuredData.industry} industry with ${structuredData.employeeCount} employees and $${structuredData.annualRevenue.toLocaleString()} in annual revenue, we recommend a comprehensive business insurance policy with liability coverage of $${coverageLimit.toLocaleString()}.

This coverage includes general liability, professional liability, and property insurance appropriate for your business size and industry risk profile.

For questions or customizations, please contact your agent or call our support line.`;

    // Create pre-filled form
    const formData: InsuranceForm = {
      companyName: structuredData.name || "Unknown Company",
      address: structuredData.address || "No address provided",
      city: structuredData.city || "Unknown",
      state: structuredData.state || "Unknown",
      zipCode: structuredData.zipCode || "00000",
      industry: structuredData.industry || "Unknown",
      employeeCount: structuredData.employeeCount || 0,
      annualRevenue: structuredData.annualRevenue || 0,
      yearFounded: structuredData.yearFounded || new Date().getFullYear(),
      deductibleAmount: deductibleAmount,
      coverageLimit: coverageLimit,
      effectiveDate: currentDate.toISOString().split('T')[0],
      expirationDate: expirationDate.toISOString().split('T')[0],
      premiumAmount: premiumAmount,
      contactName: structuredData.contactName || "No contact provided",
      contactEmail: structuredData.contactEmail || "no-email@example.com",
      contactPhone: structuredData.contactPhone || "000-000-0000",
      additionalNotes: additionalNotes
    };

    // Return the form data
    return NextResponse.json({
      success: true,
      data: formData
    });
  } catch (error) {
    console.error('Error generating form:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate form' },
      { status: 500 }
    );
  }
} 