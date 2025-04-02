import { useState, useCallback } from 'react';

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
      setError(null);
      setIsLoading(true);
      
      // Stop any playing audio first
      stopSpeech();
      
      // Call the API to convert text to speech
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate speech');
      }
      
      // Get audio blob
      const audioBlob = await response.blob();
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