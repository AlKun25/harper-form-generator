import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { InsuranceForm } from '@/types';
import { Mic, Volume2, VolumeX, Send, AlertCircle, Loader2, Square } from 'lucide-react';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import useTextToSpeech from '@/hooks/useTextToSpeech';
import aiProvider, { AIProviderType } from '@/lib/ai-services/ai-provider';
import { useFormContext } from './FormProvider';
import { cn } from '@/lib/utils';

interface ConversationInterfaceProps {
  className?: string;
}

export function ConversationInterface({ 
  className = ''
}: ConversationInterfaceProps) {
  const {
    form: formData,
    messages,
    isProcessingMessage: isProcessing,
    sendMessage: processUserMessage,
    useLangGraph
  } = useFormContext();
  
  const [userInput, setUserInput] = useState('');
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
    toggleRecording 
  } = useVoiceRecording({
    onTranscriptionComplete: (transcript: string) => {
      if (transcript.trim()) {
        setUserInput(transcript);
        // Auto-submit the transcript
        handleSubmit(new Event('submit') as unknown as React.FormEvent);
      }
    },
    onTranscriptionStart: () => {
      // Clear input when starting new recording
      setUserInput('');
    },
    onError: (error: string) => {
      console.error('Voice recording error:', error);
    },
    debug: true
  });

  // Initialize text-to-speech hook
  const {
    isPlaying,
    isLoading: isSpeaking,
    error: ttsError,
    speakText,
    stopSpeech
  } = useTextToSpeech({ debug: true });

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

  // Auto-scroll when new messages are added
  useEffect(() => {
    setTimeout(scrollToBottom, 100);
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.trim()) {
      const message = userInput;
      setUserInput('');
      await processUserMessage(message);
    }
  };

  const handleVoiceToggle = () => {
    if (!aiProviderStatus.hasVoiceFeatures) return;
    toggleRecording();
  };

  const handleSpeechToggle = () => {
    if (isPlaying) {
      stopSpeech();
    } else {
      // Only speak the last assistant message when button is clicked
      const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
      if (lastAssistantMessage) {
        speakText(lastAssistantMessage.content);
      }
    }
  };
  
  // Determine if voice features should be shown
  const showVoiceFeatures = isBrowserSupported && aiProviderStatus.hasVoiceFeatures;

  return (
    <div className={`flex flex-col h-full border-l overflow-hidden ${className}`}>
      <div className="bg-gray-50 dark:bg-gray-800 p-3 border-b dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
            Insurance Advisor {useLangGraph ? '(LangGraph)' : ''}
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
                  className="flex items-center space-x-1 h-7 px-2"
                  title={isPlaying ? "Stop speaking" : "Speak last response"}
                >
                  {isPlaying ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  <span className="ml-1 text-xs">{isPlaying ? "Stop" : "Speak"}</span>
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  // Allow clicking to stop recording when already recording
                  disabled={!showVoiceFeatures || (!isRecording && (isProcessing || isTranscribing))}
                  onClick={handleVoiceToggle}
                  className={cn(
                    "ml-auto flex h-8 w-8 items-center justify-center rounded-full",
                    isRecording ? "bg-red-500 text-white hover:bg-red-600" : "hover:bg-accent"
                  )}
                  type="button"
                  title={isRecording ? "Stop recording" : "Start recording"}
                >
                  {isRecording ? (
                    <Square className="h-4 w-4" />
                  ) : isTranscribing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] p-3 rounded-lg ${
                msg.role === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t p-3 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex space-x-2">
          <div className="flex-grow relative">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isProcessing || isRecording || isTranscribing}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            {(recordingError || ttsError) && (
              <div className="absolute right-3 top-2 text-red-500" title={recordingError || ttsError || undefined}>
                <AlertCircle size={18} />
              </div>
            )}
          </div>
          <Button
            type="submit"
            disabled={!userInput.trim() || isProcessing || isRecording || isTranscribing}
            className="flex items-center justify-center"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
} 