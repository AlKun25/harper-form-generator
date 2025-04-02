import { NextRequest, NextResponse } from 'next/server';
import aiProvider, { AIProviderType } from '@/lib/ai-services/ai-provider';
import { InsuranceForm } from '@/types';

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

    // Check if AI is available
    if (aiProvider.getCurrentProvider() === AIProviderType.NONE) {
      // If no AI is available, return a basic form with placeholders
      const basicForm = createBasicForm();
      return NextResponse.json({ success: true, formData: basicForm });
    }

    // Use AI provider to extract structured data
    try {
      const systemPrompt = `You are an AI that extracts structured data from unstructured text. The user will provide transcripts from a company. Extract the key information into a structured format.`;
      
      const userPrompt = `Extract the following information from these company transcripts and notes. Return ONLY a JSON object with these fields (use null if information is not available):
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
      `;
      
      const response = await aiProvider.chatCompletion({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
      });
      
      // Parse the response to JSON
      let structuredData;
      try {
        const messageContent = response.text || '{}';
        // Extract JSON object if the response contains it
        const jsonMatch = messageContent.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : '{}';
        structuredData = JSON.parse(jsonString);
      } catch (error) {
        throw new Error('Failed to parse AI-generated data');
      }
      
      // Use the extracted data to create a pre-filled insurance form
      const formData = createFormFromData(structuredData);
      
      return NextResponse.json({ success: true, formData });
    } catch (error) {
      console.error('Error using AI for form generation:', error);
      
      // Fallback to a basic form if AI processing fails
      const basicForm = createBasicForm();
      return NextResponse.json({ 
        success: true, 
        formData: basicForm,
        warning: 'Used fallback form due to AI processing error'
      });
    }
  } catch (error) {
    console.error('Error generating form:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate form' },
      { status: 500 }
    );
  }
}

// Function to create a basic form with placeholders
function createBasicForm(): InsuranceForm {
  const currentDate = new Date();
  const expirationDate = new Date();
  expirationDate.setFullYear(expirationDate.getFullYear() + 1);
  
  return {
    companyName: 'Your Company',
    address: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zipCode: '12345',
    industry: 'Please specify',
    employeeCount: 10,
    annualRevenue: 1000000,
    yearFounded: 2010,
    contactName: 'Your Name',
    contactEmail: 'your.email@example.com',
    contactPhone: '(555) 555-5555',
    coverageLimit: 1000000,
    deductibleAmount: 5000,
    premiumAmount: 15000,
    effectiveDate: currentDate.toISOString().split('T')[0],
    expirationDate: expirationDate.toISOString().split('T')[0],
    additionalNotes: 'Please review and customize this insurance quote according to your specific business needs.'
  };
}

// Function to create a form from structured data
function createFormFromData(data: any): InsuranceForm {
  // Calculate coverage limit based on annual revenue and industry
  const annualRevenue = typeof data.annualRevenue === 'number' ? data.annualRevenue : 1000000;
  let coverageLimit = Math.min(annualRevenue * 0.5, 10000000);
  
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
  const companyName = data.name || 'your company';
  const industry = data.industry || 'your industry';
  const employees = data.employeeCount || 'your employees';
  const revenue = annualRevenue.toLocaleString();
  
  const additionalNotes = `Based on ${companyName}'s profile in the ${industry} industry with ${employees} employees and $${revenue} in annual revenue, we recommend a comprehensive business insurance policy with liability coverage of $${coverageLimit.toLocaleString()}.

This coverage includes general liability, professional liability, and property insurance appropriate for your business size and industry risk profile.

For questions or customizations, please contact your agent or call our support line.`;

  return {
    companyName: data.name || 'Your Company',
    address: data.address || '123 Main St',
    city: data.city || 'Anytown',
    state: data.state || 'CA',
    zipCode: data.zipCode || '12345',
    industry: data.industry || 'Please specify',
    employeeCount: data.employeeCount || 10,
    annualRevenue: annualRevenue,
    yearFounded: data.yearFounded || 2010,
    contactName: data.contactName || 'Your Name',
    contactEmail: data.contactEmail || 'your.email@example.com',
    contactPhone: data.contactPhone || '(555) 555-5555',
    coverageLimit: coverageLimit,
    deductibleAmount: deductibleAmount,
    premiumAmount: premiumAmount,
    effectiveDate: currentDate.toISOString().split('T')[0],
    expirationDate: expirationDate.toISOString().split('T')[0],
    additionalNotes: additionalNotes
  };
} 