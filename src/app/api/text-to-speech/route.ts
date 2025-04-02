import { NextRequest, NextResponse } from 'next/server';
import aiProvider, { AIProviderType } from '@/lib/ai-services/ai-provider';

export async function POST(request: NextRequest) {
  try {
    // Check if we have an AI provider that supports voice
    if (aiProvider.getCurrentProvider() !== AIProviderType.OPENAI) {
      return NextResponse.json(
        { success: false, error: 'Voice features are not available' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { text, voice } = body;

    if (!text) {
      return NextResponse.json(
        { success: false, error: 'Text is required' },
        { status: 400 }
      );
    }

    // Generate speech using the AI provider
    const result = await aiProvider.textToSpeech({
      text,
      voice: voice || 'nova'
    });

    // Return the audio as a streaming response
    return new NextResponse(result.audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': result.audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating speech:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate speech' },
      { status: 500 }
    );
  }
} 