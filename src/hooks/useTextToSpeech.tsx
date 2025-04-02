import { useState, useRef, useCallback, useEffect } from 'react';

interface UseTextToSpeechOptions {
  debug?: boolean;
}

export default function useTextToSpeech({ debug = false }: UseTextToSpeechOptions = {}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Cleanup audio element when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Stop playback
  const stopSpeech = useCallback(() => {
    if (debug) console.log('TTS - Stopping speech');
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    setIsPlaying(false);
  }, [debug]);

  // Speak the provided text
  const speakText = useCallback(async (text: string) => {
    if (!text || !text.trim()) return;
    
    if (debug) console.log('TTS - Speaking text:', text.substring(0, 50) + '...');
    
    // Stop any current playback
    stopSpeech();
    
    // Reset state
    setError(null);
    setIsLoading(true);
    
    try {
      // Call the API to convert text to speech
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      // Get the audio blob from the response
      const audioBlob = await response.blob();
      
      if (debug) console.log(`TTS - Received audio, size: ${audioBlob.size} bytes`);
      
      if (audioBlob.size === 0) {
        throw new Error('Received empty audio response');
      }
      
      // Create audio element
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audioRef.current = audio;
      
      // Set up event handlers
      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.onpause = () => setIsPlaying(false);
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setError('Failed to play audio');
        setIsPlaying(false);
      };
      
      // Start playback
      await audio.play();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Text-to-speech failed';
      console.error('TTS error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [debug, stopSpeech]);
  
  return {
    isPlaying,
    isLoading,
    error,
    speakText,
    stopSpeech
  };
} 