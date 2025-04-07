import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client on server-side only
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voice = 'nova' } = body;

    if (!text) {
      return NextResponse.json(
        { success: false, error: 'Text is required' },
        { status: 400 }
      );
    }

    // Generate speech using the OpenAI API directly
    try {
      const mp3 = await openai.audio.speech.create({
        model: 'tts-1',
        voice: voice,
        input: text,
      });
      
      const buffer = await mp3.arrayBuffer();

      // Return the audio as a streaming response
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': buffer.byteLength.toString(),
        },
      });
    } catch (openaiError: any) {
      console.error('OpenAI TTS error:', openaiError);
      
      // Handle specific OpenAI errors
      if (openaiError.status === 429) {
        return NextResponse.json(
          { success: false, error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      
      throw openaiError; // Re-throw to be caught by the outer catch
    }
  } catch (error) {
    console.error('Error generating speech:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate speech' },
      { status: 500 }
    );
  }
} 