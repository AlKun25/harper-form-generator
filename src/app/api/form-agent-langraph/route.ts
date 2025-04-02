import { NextRequest, NextResponse } from 'next/server';
import { processFormAgentMessage } from '@/lib/agents/langgraph-form-agent';
import { InsuranceForm } from '@/types';

export const runtime = 'edge';

/**
 * Form agent API endpoint using LangGraph implementation
 */
export async function POST(req: NextRequest) {
  try {
    const { message, formData, debug = false } = await req.json();

    // Validate required parameters
    if (!message) {
      return NextResponse.json({ 
        success: false, 
        error: 'Message is required' 
      }, { status: 400 });
    }

    if (!formData) {
      return NextResponse.json({ 
        success: false, 
        error: 'Form data is required' 
      }, { status: 400 });
    }

    // Generate a simple conversation ID
    const conversationId = `conv_${Date.now()}`;
    
    if (debug) {
      console.log(`[FormAgent LangGraph] Processing message for conversation ${conversationId}:`, message);
      console.log(`[FormAgent LangGraph] Current form data:`, formData);
    }

    // Process the message through the form agent
    const { updates, explanation, currentSection } = await processFormAgentMessage(
      message,
      formData as InsuranceForm,
      debug
    );

    if (debug) {
      console.log(`[FormAgent LangGraph] Form updates:`, updates);
      console.log(`[FormAgent LangGraph] Explanation:`, explanation);
      console.log(`[FormAgent LangGraph] Current section:`, currentSection);
    }

    // Return the results
    return NextResponse.json({
      success: true,
      data: {
        updates,
        explanation,
        currentSection
      }
    });
  } catch (error) {
    console.error('[FormAgent LangGraph] Unexpected error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
} 