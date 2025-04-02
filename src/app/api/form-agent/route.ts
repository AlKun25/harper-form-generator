import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { InsuranceForm } from '@/types';

// Initialize OpenAI client on server-side only
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

export async function POST(request: NextRequest) {
  try {
    const { message, formData, companyId, debug = false } = await request.json();

    if (!message || !formData) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (debug) {
      console.log('FormAgent API - Processing message:', message);
      console.log('FormAgent API - Current form data:', formData);
    }

    // Step 1: Classify user intent to determine the appropriate response strategy
    const intentClassification = await classifyIntent(message, formData);
    
    if (debug) {
      console.log('FormAgent API - Intent classification:', intentClassification);
    }

    // Step 2: Extract form updates if the intent is to update the form
    let updates = {};
    let explanation = "";

    if (intentClassification.primaryIntent === 'UPDATE_FORM') {
      // Extract form updates with field disambiguation
      const extractionResult = await extractFormUpdates(message, formData, intentClassification);
      updates = extractionResult.updates;
      
      if (Object.keys(updates).length > 0) {
        explanation = generateUpdateExplanation(updates, extractionResult.reasoning);
      } else {
        explanation = "I understand you want to update the form, but I'm not sure which field to update. Could you please specify which field you'd like to change?";
      }
    } else {
      // Generate a conversational response based on the intent
      explanation = await generateConversationalResponse(message, formData, intentClassification);
    }
    
    if (debug) {
      console.log('FormAgent API - Final updates:', updates);
      console.log('FormAgent API - Explanation:', explanation);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        updates,
        explanation
      }
    });
    
  } catch (error) {
    console.error('FormAgent API - Unexpected error:', error);
    
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * Classify the user's intent to determine how to respond
 */
async function classifyIntent(message: string, formData: InsuranceForm) {
  const intentPrompt = `
    You are an expert insurance agent assistant. Analyze the user's message and classify their intent.
    
    Current form data:
    ${JSON.stringify(formData, null, 2)}
    
    User message: "${message}"
    
    Classify the user's intent into ONE of the following categories:
    1. UPDATE_FORM: User wants to update a specific field in the form
    2. GENERAL_QUESTION: User is asking a general question about insurance
    3. FORM_QUESTION: User is asking about specific information in the form
    4. GUIDANCE: User is asking for guidance on completing the form
    5. GREETING: User is greeting or starting a conversation
    6. OTHER: Another intent not covered above
    
    For UPDATE_FORM, also identify:
    - The specific field(s) they want to update
    - If there's any ambiguity (e.g., "zipCode" could refer to applicant's address or premises)
    - The value they want to set
    
    Return a JSON object with the following structure:
    {
      "primaryIntent": "one of the categories above",
      "targetFields": ["field1", "field2"],
      "ambiguousFields": ["ambiguousField1"],
      "values": {"field1": "value1"},
      "confidenceScore": 0.95,
      "reasoning": "brief explanation of the classification"
    }
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: intentPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content || '{}';
    return JSON.parse(content);
  } catch (error) {
    console.error('Error classifying intent:', error);
    return {
      primaryIntent: 'OTHER',
      targetFields: [],
      ambiguousFields: [],
      values: {},
      confidenceScore: 0.5,
      reasoning: 'Failed to classify intent due to an error'
    };
  }
}

/**
 * Extract form updates with field disambiguation
 */
async function extractFormUpdates(message: string, formData: InsuranceForm, intentClassification: any) {
  // Construct a prompt that's aware of ambiguous fields
  const extractionPrompt = `
    You are an expert insurance agent assistant specializing in form completion.
    
    Current form data:
    ${JSON.stringify(formData, null, 2)}
    
    User message: "${message}"
    
    Previous intent classification:
    ${JSON.stringify(intentClassification, null, 2)}
    
    ${intentClassification.ambiguousFields?.length > 0 ? 
      `The following fields are ambiguous and need disambiguation:
       ${intentClassification.ambiguousFields.join(', ')}
       
       For example, "zipCode" could refer to either:
       - The applicant's mailing address ZIP code
       - The premises location ZIP code
       
       Use context and form state to determine which field the user is most likely referring to.` 
      : ''
    }
    
    Extract the specific fields and values that need to be updated in the form.
    Return a JSON object with the following structure:
    {
      "updates": {
        "fieldName1": "value1",
        "fieldName2": "value2"
      },
      "reasoning": "explanation of how you determined these fields and values, including any disambiguation"
    }
    
    NOTE: Only include fields in the following list:
    - companyName (string)
    - address (string)
    - city (string)
    - state (string)
    - zipCode (string)
    - industry (string)
    - employeeCount (number)
    - annualRevenue (number)
    - yearFounded (number)
    - deductibleAmount (number)
    - coverageLimit (number)
    - effectiveDate (string, YYYY-MM-DD format)
    - expirationDate (string, YYYY-MM-DD format)
    - premiumAmount (number)
    - contactName (string)
    - contactEmail (string)
    - contactPhone (string)
    - additionalNotes (string)
    
    For numeric fields, convert values to numbers.
    For dates, use YYYY-MM-DD format.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: extractionPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content || '{}';
    const result = JSON.parse(content);
    
    // Validate numeric values
    Object.entries(result.updates || {}).forEach(([key, value]) => {
      const field = key as keyof InsuranceForm;
      
      // Convert numeric string values to actual numbers
      if (['employeeCount', 'annualRevenue', 'yearFounded', 'deductibleAmount', 
           'coverageLimit', 'premiumAmount'].includes(field) && 
          typeof value === 'string') {
        const numericValue = Number(value);
        if (!isNaN(numericValue)) {
          (result.updates as any)[field] = numericValue;
        }
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error extracting form updates:', error);
    return {
      updates: {},
      reasoning: 'Failed to extract updates due to an error'
    };
  }
}

/**
 * Generate a natural language explanation of the updates
 */
function generateUpdateExplanation(updates: Record<string, any>, reasoning: string = "") {
  const fieldNames = Object.keys(updates);
  
  if (fieldNames.length === 0) {
    return "I don't see any specific fields to update. Could you please clarify what information you'd like to change?";
  }
  
  // Format values for display
  const formattedValues = fieldNames.map(field => {
    const value = updates[field];
    
    // Format based on field type
    if (['employeeCount', 'annualRevenue', 'yearFounded', 'deductibleAmount', 
         'coverageLimit', 'premiumAmount'].includes(field)) {
      return `${formatFieldName(field)}: ${formatNumber(value, field)}`;
    } else if (['effectiveDate', 'expirationDate'].includes(field)) {
      return `${formatFieldName(field)}: ${formatDate(value)}`;
    } else {
      return `${formatFieldName(field)}: ${value}`;
    }
  });
  
  // Generate a more conversational and professional response
  if (fieldNames.length === 1) {
    return `Perfect! I've updated the ${formatFieldName(fieldNames[0])} to ${updates[fieldNames[0]]}. Is there anything else you'd like to change?`;
  } else {
    return `Great! I've updated the following information:\n- ${formattedValues.join('\n- ')}\n\nIs there anything else you'd like to update?`;
  }
}

/**
 * Generate a conversational response based on the intent
 */
async function generateConversationalResponse(message: string, formData: InsuranceForm, intentClassification: any) {
  const responsePrompt = `
    You are Harper, a friendly and professional insurance agent assistant.
    
    Current form data:
    ${JSON.stringify(formData, null, 2)}
    
    User message: "${message}"
    
    Intent classification:
    ${JSON.stringify(intentClassification, null, 2)}
    
    Generate a helpful, conversational response that addresses the user's intent.
    
    Guidelines:
    - Use a warm, friendly, and professional tone
    - Respond as an insurance professional would
    - Be concise but informative
    - If the user is asking about insurance concepts, provide accurate information
    - If they're asking about the form, reference relevant information from the current form data
    - NEVER mention that you're an AI or language model
    - DO NOT use phrases like "I've processed your request" or "I understand your intent"
    - Don't apologize for not finding updates if there were none - instead, be helpful
    
    Maximum response length: 3 sentences.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: responsePrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    return response.choices[0].message.content || 
      "I'd be happy to help with your insurance form. What would you like to know or update?";
  } catch (error) {
    console.error('Error generating conversational response:', error);
    return "I'd be happy to help with your insurance form. What would you like to know or update?";
  }
}

// Helper functions
function formatFieldName(field: string): string {
  // Convert camelCase to space-separated words
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
}

function formatNumber(value: number, field: string): string {
  // Format currency values with $ and commas
  if (['annualRevenue', 'deductibleAmount', 'coverageLimit', 'premiumAmount'].includes(field)) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }
  // Format other numbers with commas
  return new Intl.NumberFormat('en-US').format(value);
}

function formatDate(dateStr: string): string {
  // Try to format the date in a more readable format
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
  } catch (e) {
    return dateStr; // Return original if parsing fails
  }
} 