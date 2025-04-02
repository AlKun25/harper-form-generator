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

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { success: false, error: 'Audio file is required' },
        { status: 400 }
      );
    }

    // Convert the file to a Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const blob = new Blob([buffer], { type: audioFile.type });

    // Transcribe using the AI provider
    const transcription = await aiProvider.transcribeAudio({
      audioBlob: blob,
    });

    return NextResponse.json({
      success: true,
      data: {
        text: transcription.text
      }
    });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
} 