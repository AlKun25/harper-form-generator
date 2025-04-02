import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Define AI provider types
export enum AIProviderType {
  OPENAI = 'openai',
  GEMINI = 'gemini',
  NONE = 'none'
}

// Interface for chat completions
export interface ChatCompletionRequest {
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
  temperature?: number;
}

export interface ChatCompletionResponse {
  text: string;
}

// Interface for audio transcription
export interface TranscriptionRequest {
  audioBlob: Blob;
}

export interface TranscriptionResponse {
  text: string;
}

// Interface for text-to-speech
export interface TextToSpeechRequest {
  text: string;
  voice?: string;
}

export interface TextToSpeechResponse {
  audioBuffer: ArrayBuffer;
}

// AI Provider class with fallback mechanisms
class AIProvider {
  private openai: OpenAI | null = null;
  private gemini: GoogleGenerativeAI | null = null;
  private currentProvider: AIProviderType = AIProviderType.OPENAI;
  
  constructor() {
    this.initialize();
  }
  
  private initialize() {
    // Try to initialize OpenAI
    const openaiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
    if (openaiApiKey) {
      try {
        this.openai = new OpenAI({
          apiKey: openaiApiKey,
          dangerouslyAllowBrowser: true,
        });
        this.currentProvider = AIProviderType.OPENAI;
        console.log('AIProvider: Using OpenAI provider');
        return;
      } catch (error) {
        console.error('Error initializing OpenAI:', error);
      }
    }
    
    // Try to initialize Gemini if OpenAI fails
    const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    if (geminiApiKey) {
      try {
        this.gemini = new GoogleGenerativeAI(geminiApiKey);
        this.currentProvider = AIProviderType.GEMINI;
        console.log('AIProvider: Using Gemini provider');
        return;
      } catch (error) {
        console.error('Error initializing Gemini:', error);
      }
    }
    
    // If all providers fail, set to NONE
    this.currentProvider = AIProviderType.NONE;
    console.log('AIProvider: No AI provider available - using form-only mode');
  }
  
  // Get the current provider type
  getCurrentProvider(): AIProviderType {
    return this.currentProvider;
  }
  
  // Check if voice features are available (requires OpenAI)
  hasVoiceFeatures(): boolean {
    return this.currentProvider === AIProviderType.OPENAI;
  }
  
  // Chat completion function with fallback
  async chatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      // Try OpenAI first
      if (this.currentProvider === AIProviderType.OPENAI && this.openai) {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: request.messages,
          temperature: request.temperature || 0.7,
        });
        
        return {
          text: response.choices[0]?.message?.content || ''
        };
      }
      
      // Try Gemini if OpenAI fails
      if (this.currentProvider === AIProviderType.GEMINI && this.gemini) {
        const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-pro' });
        
        // Convert OpenAI format to Gemini
        const history: any[] = [];
        
        for (const message of request.messages) {
          if (message.role === 'system') {
            // Add system message as user message with [SYSTEM] prefix for Gemini
            history.push({
              role: 'user',
              parts: [`[SYSTEM] ${message.content}`]
            });
            // Add a blank assistant response
            history.push({
              role: 'model',
              parts: ['Understood.']
            });
          } else {
            history.push({
              role: message.role === 'assistant' ? 'model' : 'user',
              parts: [message.content]
            });
          }
        }
        
        // Remove the last element if it's a model response (we only want to send complete turns)
        if (history.length > 0 && history[history.length - 1].role === 'model') {
          history.pop();
        }
        
        // Use the chat API
        const chat = model.startChat({
          history: history.length > 1 ? history.slice(0, -1) : [],
          generationConfig: {
            temperature: request.temperature || 0.7,
          },
        });
        
        const lastMessage = history.length > 0 ? history[history.length - 1].parts[0] : '';
        const result = await chat.sendMessage(lastMessage);
        const response = await result.response;
        
        return {
          text: response.text()
        };
      }
      
      // If all providers fail, return error message
      throw new Error('No AI provider available');
    } catch (error) {
      console.error('Error in chat completion:', error);
      throw error;
    }
  }
  
  // Transcription function (OpenAI only)
  async transcribeAudio(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    if (this.currentProvider !== AIProviderType.OPENAI || !this.openai) {
      throw new Error('Transcription requires OpenAI provider');
    }
    
    try {
      const transcription = await this.openai.audio.transcriptions.create({
        file: new File([request.audioBlob], 'audio.webm', { type: 'audio/webm' }),
        model: 'whisper-1',
      });
      
      return {
        text: transcription.text
      };
    } catch (error) {
      console.error('Error in audio transcription:', error);
      throw error;
    }
  }
  
  // Text-to-speech function (OpenAI only)
  async textToSpeech(request: TextToSpeechRequest): Promise<TextToSpeechResponse> {
    if (this.currentProvider !== AIProviderType.OPENAI || !this.openai) {
      throw new Error('Text-to-speech requires OpenAI provider');
    }
    
    try {
      const mp3 = await this.openai.audio.speech.create({
        model: 'tts-1',
        voice: request.voice || 'nova',
        input: request.text,
      });
      
      const buffer = await mp3.arrayBuffer();
      
      return {
        audioBuffer: buffer
      };
    } catch (error) {
      console.error('Error in text-to-speech:', error);
      throw error;
    }
  }
}

// Create a singleton instance
export const aiProvider = new AIProvider();

export default aiProvider; 