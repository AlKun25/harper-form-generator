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
  private currentProvider: AIProviderType = AIProviderType.NONE;
  private openaiAvailable: boolean = false;
  private geminiAvailable: boolean = false;
  
  constructor() {
    this.initialize();
  }
  
  private initialize() {
    // Always try to initialize both providers
    this.initializeOpenAI();
    this.initializeGemini();
    
    // Select the best available provider
    this.selectBestProvider();
  }
  
  private initializeOpenAI() {
    const openaiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
    if (openaiApiKey) {
      try {
        this.openai = new OpenAI({
          apiKey: openaiApiKey,
          dangerouslyAllowBrowser: true,
        });
        this.openaiAvailable = true;
        console.log('AIProvider: OpenAI initialized successfully');
      } catch (error) {
        console.error('Error initializing OpenAI:', error);
        this.openaiAvailable = false;
      }
    } else {
      console.log('AIProvider: No OpenAI API key provided');
      this.openaiAvailable = false;
    }
  }
  
  private initializeGemini() {
    const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    if (geminiApiKey) {
      try {
        this.gemini = new GoogleGenerativeAI(geminiApiKey);
        this.geminiAvailable = true;
        console.log('AIProvider: Gemini initialized successfully');
      } catch (error) {
        console.error('Error initializing Gemini:', error);
        this.geminiAvailable = false;
      }
    } else {
      console.log('AIProvider: No Gemini API key provided');
      this.geminiAvailable = false;
    }
  }
  
  private selectBestProvider() {
    // Prefer OpenAI if available (for voice features)
    if (this.openaiAvailable) {
      this.currentProvider = AIProviderType.OPENAI;
      console.log('AIProvider: Using OpenAI as primary provider');
    } else if (this.geminiAvailable) {
      this.currentProvider = AIProviderType.GEMINI;
      console.log('AIProvider: Using Gemini as primary provider');
    } else {
      this.currentProvider = AIProviderType.NONE;
      console.log('AIProvider: No AI provider available - using form-only mode');
    }
  }
  
  // Switch to fallback provider
  private switchToFallback() {
    // If we're currently using OpenAI, try switching to Gemini
    if (this.currentProvider === AIProviderType.OPENAI && this.geminiAvailable) {
      this.currentProvider = AIProviderType.GEMINI;
      console.log('AIProvider: Switched to Gemini as fallback');
      return true;
    }
    // If we're currently using Gemini, we don't have a fallback
    return false;
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
    // Try with current provider first
    try {
      if (this.currentProvider === AIProviderType.OPENAI) {
        return await this.openAIChatCompletion(request);
      } else if (this.currentProvider === AIProviderType.GEMINI) {
        return await this.geminiChatCompletion(request);
      } else {
        // No provider available
        console.error('No AI provider available');
        return { text: 'I cannot process that request right now. Please try again later.' };
      }
    } catch (error) {
      console.error('Error with primary provider, attempting fallback:', error);
      
      // Try fallback
      if (this.switchToFallback()) {
        try {
          // We've switched to Gemini, try the request again
          return await this.geminiChatCompletion(request);
        } catch (fallbackError) {
          console.error('Fallback provider also failed:', fallbackError);
        }
      }
      
      // If we get here, both providers failed or there was no fallback
      console.error('All providers failed, returning generic response');
      return { text: 'I cannot process that request right now. Please try again later.' };
    }
  }
  
  // OpenAI chat completion implementation
  private async openAIChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }
    
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: request.messages,
        temperature: request.temperature || 0.7,
      });
      
      return {
        text: response.choices[0]?.message?.content || ''
      };
    } catch (error: any) {
      // Check for quota exceeded error
      const isQuotaExceeded = 
        error.status === 429 || 
        (error.error && error.error.type === 'insufficient_quota') ||
        (error.message && error.message.includes('quota'));
      
      if (isQuotaExceeded) {
        console.error('OpenAI quota exceeded');
        // Explicitly throw a quota exceeded error to trigger fallback
        throw new Error('quota_exceeded');
      }
      
      // Rethrow other errors
      throw error;
    }
  }
  
  // Gemini chat completion implementation
  private async geminiChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!this.gemini) {
      throw new Error('Gemini client not initialized');
    }
    
    try {
      console.log('Using Gemini provider for chat completion');
      const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-pro' });
      
      // Extract system message to prepend to the prompt
      let systemInstructions = '';
      
      // Get all messages that aren't system messages
      const nonSystemMessages = request.messages.filter(message => {
        if (message.role === 'system') {
          systemInstructions += message.content + '\n\n';
          return false;
        }
        return true;
      });
      
      console.log(`Gemini: Processing ${nonSystemMessages.length} non-system messages`);
      
      try {
        // For conversation-style requests with multiple turns
        if (nonSystemMessages.length > 1) {
          console.log('Gemini: Handling multi-turn conversation');
          // Format as a conversation transcript
          let formattedPrompt = systemInstructions ? systemInstructions + '\n\n' : '';
          formattedPrompt += 'The following is a conversation between a human and an AI assistant:\n\n';
          
          for (const message of nonSystemMessages) {
            const role = message.role === 'user' ? 'Human' : 'AI';
            formattedPrompt += `${role}: ${message.content}\n\n`;
          }
          
          // Add the expected next turn marker
          formattedPrompt += 'AI: ';
          
          console.log('Gemini: Sending conversation prompt');
          // Use the simple generation API with more explicit error handling
          const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: formattedPrompt }] }],
            generationConfig: {
              temperature: request.temperature || 0.7,
              maxOutputTokens: 800,
            },
          });
          
          const response = await result.response;
          const text = response.text();
          console.log('Gemini: Successfully generated response');
          
          return { text };
        } 
        // For single turn requests
        else if (nonSystemMessages.length === 1) {
          console.log('Gemini: Handling single-turn request');
          const userMessage = nonSystemMessages[0].content;
          const promptText = systemInstructions 
            ? `${systemInstructions}\n\n${userMessage}`
            : userMessage;
          
          console.log('Gemini: Sending prompt with system instructions');
          const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: promptText }] }],
            generationConfig: {
              temperature: request.temperature || 0.7,
              maxOutputTokens: 800,
            },
          });
          
          const response = await result.response;
          console.log('Gemini: Successfully generated response');
          return { text: response.text() };
        } 
        // No valid messages
        else {
          console.warn('Gemini: No valid messages to send');
          return { text: 'I cannot process that request right now.' };
        }
      } catch (contentError) {
        // Handle Gemini content generation errors specifically
        console.error('Gemini content generation error:', contentError);
        
        // Try a simplified fallback approach
        console.log('Gemini: Trying simplified fallback with just the last message');
        try {
          const lastUserMessage = nonSystemMessages.filter(m => m.role === 'user').pop();
          if (lastUserMessage) {
            // Try with just the last user message and no system instructions
            const result = await model.generateContent(lastUserMessage.content);
            const response = await result.response;
            console.log('Gemini: Fallback successful');
            return { text: response.text() };
          }
        } catch (fallbackError) {
          console.error('Gemini fallback also failed:', fallbackError);
        }
        
        // If we get here, throw the original error
        throw contentError;
      }
    } catch (error) {
      console.error('Error in Gemini completion:', error);
      // Include helpful diagnostics in the error
      const errorObj = {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace available',
        name: error instanceof Error ? error.name : 'UnknownError'
      };
      console.error('Gemini error details:', JSON.stringify(errorObj, null, 2));
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