/**
 * Voice Interface Mock for Testing
 * 
 * This module provides utilities for testing the conversational interface
 * without requiring actual microphone input or audio output.
 */

// Mock audio recording behavior
export class MockAudioRecorder {
  private isRecording = false;
  private onDataCallback: ((data: Blob) => void) | null = null;
  
  /**
   * Start recording audio
   */
  startRecording(onData: (data: Blob) => void) {
    this.isRecording = true;
    this.onDataCallback = onData;
    return Promise.resolve();
  }
  
  /**
   * Stop recording audio
   */
  stopRecording() {
    this.isRecording = false;
    return Promise.resolve();
  }
  
  /**
   * Simulate speaking into the microphone by injecting a mock audio blob
   */
  simulateSpeech(transcriptText: string) {
    if (!this.isRecording || !this.onDataCallback) {
      throw new Error('Cannot simulate speech when not recording');
    }
    
    // Create a mock blob that, when processed by the speech-to-text service,
    // will result in the provided transcript
    const mockAudioBlob = new Blob([], { type: 'audio/webm' });
    
    // Add metadata to the blob for the mock speech-to-text service to interpret
    Object.defineProperty(mockAudioBlob, 'mockTranscript', {
      value: transcriptText,
      writable: false
    });
    
    // Send the blob to the callback
    this.onDataCallback(mockAudioBlob);
    
    return Promise.resolve();
  }
}

// Mock speech-to-text service
export class MockSpeechToTextService {
  /**
   * Convert speech to text
   */
  convertSpeechToText(audioBlob: Blob): Promise<string> {
    // Check if this is a mock blob with a transcript
    if ('mockTranscript' in audioBlob) {
      return Promise.resolve((audioBlob as any).mockTranscript);
    }
    
    // If not a mock blob, return a default response
    return Promise.resolve('This is a mock transcript');
  }
}

// Mock text-to-speech service
export class MockTextToSpeechService {
  private onSpeechCompletedCallback: (() => void) | null = null;
  
  /**
   * Convert text to speech
   */
  textToSpeech(text: string): Promise<ArrayBuffer> {
    // Return a mock audio buffer
    return Promise.resolve(new ArrayBuffer(0));
  }
  
  /**
   * Play audio
   */
  playAudio(audioBuffer: ArrayBuffer, onComplete?: () => void): Promise<void> {
    this.onSpeechCompletedCallback = onComplete || null;
    
    // Simulate audio playback completion after a short delay
    setTimeout(() => {
      if (this.onSpeechCompletedCallback) {
        this.onSpeechCompletedCallback();
      }
    }, 500);
    
    return Promise.resolve();
  }
  
  /**
   * Stop audio playback
   */
  stopAudio(): Promise<void> {
    this.onSpeechCompletedCallback = null;
    return Promise.resolve();
  }
}

// Mock LLM service for processing commands
export class MockLLMService {
  /**
   * Process a voice command
   */
  processCommand(command: string, currentFormData: any): Promise<any> {
    // Map common test phrases to standardized responses
    if (command.toLowerCase().includes('deductible') && command.toLowerCase().includes('5000')) {
      return Promise.resolve({
        action: 'update',
        field: 'deductible',
        value: '$5,000',
        response: `I've updated the deductible to $5,000.`
      });
    }
    
    if (command.toLowerCase().includes('coverage') && command.toLowerCase().includes('million')) {
      return Promise.resolve({
        action: 'update',
        field: 'liabilityCoverage',
        value: '$3M',
        response: `I've updated the liability coverage to $3 million.`
      });
    }
    
    if (command.toLowerCase().includes('detroit') && command.toLowerCase().includes('flood')) {
      return Promise.resolve({
        action: 'update',
        field: 'additionalNotes',
        value: 'Need flood insurance for Detroit facility.',
        response: `I've added a note about flood insurance for the Detroit facility.`
      });
    }
    
    // Handle ambiguous commands
    if (command.toLowerCase().includes('financial information')) {
      return Promise.resolve({
        action: 'clarify',
        clarificationQuestion: 'Which financial information would you like to update? Revenue, deductible, or coverage amount?',
        response: 'I need more information. Which financial information would you like to update? Revenue, deductible, or coverage amount?'
      });
    }
    
    // For any unrecognized command, return a generic response
    return Promise.resolve({
      action: 'unknown',
      response: `I'm not sure how to process the command: "${command}". Could you please rephrase?`
    });
  }
  
  /**
   * Extract form data from company memory
   */
  extractFormData(memory: any): Promise<any> {
    // Create a basic extraction based on structured data
    const extractedData = {
      companyName: memory.structured.companyName,
      industry: memory.structured.industry,
      revenue: memory.structured.revenue,
      employeeCount: memory.structured.employeeCount,
      headquarters: memory.structured.location?.headquarters || '',
    };
    
    // Extract information from unstructured data
    const transcripts = memory.unstructured || [];
    
    // Look for liability coverage information
    const coverageMatch = transcripts.find(t => 
      t.content.toLowerCase().includes('liability') && 
      t.content.toLowerCase().includes('coverage')
    );
    
    if (coverageMatch) {
      // Simple regex to extract dollar amounts
      const match = coverageMatch.content.match(/\$\d+M/);
      if (match) {
        extractedData['liabilityCoverage'] = match[0];
      }
    }
    
    // Look for deductible information
    const deductibleMatch = transcripts.find(t => 
      t.content.toLowerCase().includes('deductible')
    );
    
    if (deductibleMatch) {
      // Simple regex to extract dollar amounts
      const match = deductibleMatch.content.match(/\$\d+,\d+/);
      if (match) {
        extractedData['deductible'] = match[0];
      }
    }
    
    return Promise.resolve(extractedData);
  }
}

/**
 * Complete Voice Interface Mock
 * 
 * This class combines all the individual mocks into a complete
 * voice interface that can be used for testing.
 */
export class MockVoiceInterface {
  public recorder: MockAudioRecorder;
  public speechToText: MockSpeechToTextService;
  public textToSpeech: MockTextToSpeechService;
  public llm: MockLLMService;
  
  private formData: any = {};
  private onUpdateCallback: ((field: string, value: string) => void) | null = null;
  
  constructor() {
    this.recorder = new MockAudioRecorder();
    this.speechToText = new MockSpeechToTextService();
    this.textToSpeech = new MockTextToSpeechService();
    this.llm = new MockLLMService();
  }
  
  /**
   * Set the current form data
   */
  setFormData(data: any) {
    this.formData = data;
  }
  
  /**
   * Register a callback to be called when a field is updated
   */
  onUpdate(callback: (field: string, value: string) => void) {
    this.onUpdateCallback = callback;
  }
  
  /**
   * Simulate the complete voice command process
   */
  async simulateVoiceCommand(command: string) {
    // Convert command to text (bypassing actual recording)
    const text = command;
    
    // Process the command
    const result = await this.llm.processCommand(text, this.formData);
    
    // Apply the result if it's an update
    if (result.action === 'update' && this.onUpdateCallback) {
      this.onUpdateCallback(result.field, result.value);
      
      // Update local copy of form data
      this.formData[result.field] = result.value;
    }
    
    // Generate and play response
    await this.textToSpeech.textToSpeech(result.response);
    
    return result;
  }
  
  /**
   * Extract form data from company memory
   */
  async extractFormData(memory: any) {
    return this.llm.extractFormData(memory);
  }
} 