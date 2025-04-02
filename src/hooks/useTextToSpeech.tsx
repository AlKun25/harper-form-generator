import { useState, useCallback } from 'react';
import aiProvider, { AIProviderType } from '@/lib/ai-services/ai-provider';

export default function useTextToSpeech() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = typeof Audio !== 'undefined' ? new Audio() : null;

  const stopSpeech = useCallback(() => {
    if (audioRef) {
      audioRef.pause();
      audioRef.currentTime = 0;
      setIsPlaying(false);
    }
  }, [audioRef]);

  const speakText = useCallback(async (text: string) => {
    if (!text || !audioRef) return;
    
    try {
      // First check if the AI provider supports voice features
      if (aiProvider.getCurrentProvider() !== AIProviderType.OPENAI) {
        throw new Error('Text-to-speech requires OpenAI to be available');
      }
      
      setError(null);
      setIsLoading(true);
      
      // Stop any playing audio first
      stopSpeech();
      
      // Call the AI provider for text-to-speech
      const response = await aiProvider.textToSpeech({
        text,
        voice: 'nova'
      });
      
      // Create audio blob
      const audioBlob = new Blob([response.audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Set up the audio element
      audioRef.src = audioUrl;
      audioRef.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      // Play the audio
      await audioRef.play();
      setIsPlaying(true);
      
    } catch (error) {
      console.error('Error generating speech:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate speech');
    } finally {
      setIsLoading(false);
    }
  }, [audioRef, stopSpeech]);

  return {
    isPlaying,
    isLoading,
    error,
    speakText,
    stopSpeech
  };
} 