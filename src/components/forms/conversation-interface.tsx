import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { InsuranceForm } from '@/types';
import { Mic, MicOff, Volume2, VolumeX, Send, AlertCircle, Loader2 } from 'lucide-react';
import useVoiceRecording from '@/hooks/useVoiceRecording';
import useTextToSpeech from '@/hooks/useTextToSpeech';
import aiProvider, { AIProviderType } from '@/lib/ai-services/ai-provider';

interface ConversationInterfaceProps {
  formData: InsuranceForm;
  onUpdateForm: (updates: Partial<InsuranceForm>) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ConversationInterface({ formData, onUpdateForm }: ConversationInterfaceProps) {
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I can help you edit this insurance form. What would you like to change?'
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isBrowserSupported, setIsBrowserSupported] = useState(false);
  const [aiProviderStatus, setAiProviderStatus] = useState<{
    provider: AIProviderType;
    hasVoiceFeatures: boolean;
  }>({
    provider: AIProviderType.NONE,
    hasVoiceFeatures: false
  });

  // Get the AI provider status on mount
  useEffect(() => {
    setAiProviderStatus({
      provider: aiProvider.getCurrentProvider(),
      hasVoiceFeatures: aiProvider.hasVoiceFeatures()
    });
  }, []);

  // Initialize voice recording hook
  const { 
    isRecording, 
    isProcessing: isTranscribing, 
    error: recordingError, 
    startRecording, 
    stopRecording 
  } = useVoiceRecording({
    onTranscriptionComplete: (text) => {
      setUserInput(text);
    },
    onAutoSubmit: (text) => {
      processUserMessage(text);
    }
  });

  // Initialize text-to-speech hook
  const {
    isPlaying,
    isLoading: isSpeaking,
    error: ttsError,
    speakText,
    stopSpeech
  } = useTextToSpeech();

  // Check browser support for voice features
  useEffect(() => {
    setIsBrowserSupported(
      typeof window !== 'undefined' && 
      'mediaDevices' in navigator && 
      'getUserMedia' in navigator.mediaDevices
    );
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const processUserMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isProcessing) return;
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    setIsProcessing(true);
    
    try {
      // Check if we have an AI provider available
      if (aiProviderStatus.provider === AIProviderType.NONE) {
        // If no AI provider is available, just acknowledge the message
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'I apologize, but the AI assistant is currently unavailable. Please edit the form directly.' 
        }]);
        setIsProcessing(false);
        setTimeout(scrollToBottom, 100);
        setUserInput('');
        return;
      }
      
      // Prepare the system message with current form data
      const systemMessage = `
You are an assistant helping a user modify an insurance form.
Here is the current form data:
${JSON.stringify(formData, null, 2)}

When the user asks you to make changes to the form, extract what needs to be changed and return a JSON object with ONLY the fields that need to be updated.
For example, if they say "Change the deductible to $5,000", you should respond with:
{"deductibleAmount": 5000}

If they say "Update the contact email to john@example.com", you should respond with:
{"contactEmail": "john@example.com"}

For currency values, extract only the numeric value (no commas, dollar signs).
For dates, use the format YYYY-MM-DD.
If you can't determine what to update, ask for clarification.
Only respond with the JSON object if a change is requested, otherwise respond conversationally.
`;

      // Call the AI provider
      const response = await aiProvider.chatCompletion({
        messages: [
          { role: 'system', content: systemMessage },
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
      });

      const assistantResponse = response.text || 'Sorry, I could not process your request.';
      
      // Add assistant response to chat
      setMessages(prev => [...prev, { role: 'assistant', content: assistantResponse }]);
      
      // Check if response contains a JSON object
      const jsonMatch = assistantResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const updates = JSON.parse(jsonMatch[0]);
          onUpdateForm(updates);
        } catch (error) {
          console.error('Error parsing updates:', error);
        }
      }

      // Automatically speak the assistant's response if voice features are available
      if (assistantResponse && aiProviderStatus.hasVoiceFeatures) {
        speakText(assistantResponse);
      }
    } catch (error) {
      console.error('Error processing conversation:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your request. Please try again.' 
      }]);
    } finally {
      setIsProcessing(false);
      setTimeout(scrollToBottom, 100);
      setUserInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await processUserMessage(userInput);
  };

  const handleVoiceToggle = () => {
    if (!aiProviderStatus.hasVoiceFeatures) {
      return;
    }
    
    if (isRecording) {
      // When stopping, set autoSubmit to true to automatically send the message
      stopRecording(true);
    } else {
      startRecording();
    }
  };

  const handleSpeechToggle = () => {
    if (!aiProviderStatus.hasVoiceFeatures) {
      return;
    }
    
    if (isPlaying) {
      stopSpeech();
    } else {
      // Speak the last assistant message if there is one
      const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
      if (lastAssistantMessage) {
        speakText(lastAssistantMessage.content);
      }
    }
  };
  
  // Determine if voice features should be shown
  const showVoiceFeatures = isBrowserSupported && aiProviderStatus.hasVoiceFeatures;

  return (
    <div className="flex flex-col h-[500px] border rounded-lg shadow-sm bg-white dark:bg-gray-800 overflow-hidden">
      <div className="bg-gray-50 dark:bg-gray-800 p-4 border-b dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            {aiProviderStatus.provider !== AIProviderType.NONE 
              ? 'Voice-Enabled Form Editor' 
              : 'Form Editor'
            }
          </h3>
          <div className="flex space-x-2">
            {showVoiceFeatures && (
              <>
                <Button 
                  type="button" 
                  size="sm" 
                  variant={isPlaying ? "secondary" : "outline"}
                  onClick={handleSpeechToggle}
                  disabled={isSpeaking || messages.length <= 1}
                  className="flex items-center space-x-1 h-8 px-2"
                  title={isPlaying ? "Stop speaking" : "Speak last response"}
                >
                  {isPlaying ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  <span className="ml-1 text-xs">{isPlaying ? "Stop" : "Speak"}</span>
                </Button>
                <Button 
                  type="button" 
                  size="sm" 
                  variant={isRecording ? "destructive" : "outline"}
                  onClick={handleVoiceToggle}
                  disabled={isTranscribing}
                  className="flex items-center space-x-1 h-8 px-2"
                  title={isRecording ? "Stop recording and send message" : "Start recording"}
                >
                  {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                  <span className="ml-1 text-xs">{isRecording ? "Stop & Send" : "Record"}</span>
                </Button>
              </>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {aiProviderStatus.provider !== AIProviderType.NONE
            ? 'Speak or type to update any field in the form'
            : 'Type to update any field in the form'
          }
        </p>
        {aiProviderStatus.provider === AIProviderType.GEMINI && (
          <div className="flex items-center mt-2 p-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
            <AlertCircle size={14} className="mr-1 flex-shrink-0" />
            <span>Using text-only mode with Gemini AI. Voice features are not available.</span>
          </div>
        )}
        {aiProviderStatus.provider === AIProviderType.NONE && (
          <div className="flex items-center mt-2 p-2 text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
            <AlertCircle size={14} className="mr-1 flex-shrink-0" />
            <span>AI assistant is unavailable. Please edit the form fields directly.</span>
          </div>
        )}
        {(recordingError || ttsError) && (
          <div className="flex items-center mt-2 p-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
            <AlertCircle size={14} className="mr-1 flex-shrink-0" />
            <span>{recordingError || ttsError}</span>
          </div>
        )}
        {isRecording && (
          <div className="flex items-center mt-2 p-2 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
            <span className="mr-2 h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>Recording... Speak clearly, then click <b>Stop & Send</b> to send your message.</span>
          </div>
        )}
        {isTranscribing && (
          <div className="flex items-center mt-2 p-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
            <Loader2 size={14} className="mr-1 animate-spin" />
            <span>Transcribing your message...</span>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-lg p-3 shadow-sm ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              }`}
            >
              {message.content}
              {message.role === 'assistant' && index === messages.length - 1 && aiProviderStatus.hasVoiceFeatures && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex justify-end">
                  {isPlaying && (
                    <span className="flex items-center">
                      <Volume2 size={12} className="mr-1" />
                      Playing audio...
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="border-t dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border rounded-md px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            disabled={isProcessing || aiProviderStatus.provider === AIProviderType.NONE}
          />
          <Button 
            type="submit" 
            size="sm"
            disabled={!userInput.trim() || isProcessing || aiProviderStatus.provider === AIProviderType.NONE}
            className="h-10 px-4"
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
} 