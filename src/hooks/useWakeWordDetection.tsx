import { useState, useEffect, useCallback, useRef } from 'react';

interface UseWakeWordDetectionProps {
  wakeWord: string;
  onWakeWordDetected: () => void;
  enabled: boolean;
}

export default function useWakeWordDetection({
  wakeWord,
  onWakeWordDetected,
  enabled = true
}: UseWakeWordDetectionProps) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBrowserSupported, setIsBrowserSupported] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    // Check if the browser supports SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsBrowserSupported(false);
      setError('Speech recognition is not supported in this browser');
      return;
    }
    
    setIsBrowserSupported(true);
    
    // Create recognition instance
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';
    
    // Handle recognition results
    recognitionRef.current.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript.trim().toLowerCase();
      
      // Check if transcript contains the wake word
      if (transcript.includes(wakeWord.toLowerCase())) {
        onWakeWordDetected();
      }
    };
    
    // Handle errors
    recognitionRef.current.onerror = (event: any) => {
      // Don't treat "aborted" as a critical error, just log and restart
      if (event.error === 'aborted') {
        console.log('Speech recognition was temporarily interrupted, restarting...');
        // Delay restart slightly to prevent rapid cycling
        if (restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current);
        }
        restartTimeoutRef.current = setTimeout(() => {
          if (isListening && enabled) {
            try {
              recognitionRef.current?.start();
            } catch (e) {
              console.error('Failed to restart after abort:', e);
            }
          }
        }, 1000);
      } else if (event.error === 'no-speech') {
        // No speech detected - this is normal, restart recognition
        setTimeout(() => {
          if (isListening && enabled && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              // Ignore errors during restart
            }
          }
        }, 300);
      } else {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      }
    };
    
    // Handle when recognition stops
    recognitionRef.current.onend = () => {
      // Restart listening if it should still be active
      if (isListening && enabled) {
        try {
          recognitionRef.current.start();
        } catch (err) {
          console.log('Error restarting recognition on end:', err);
          // If we fail to restart, set to not listening
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };
    
    return () => {
      // Clean up
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          // Ignore stop errors during cleanup
        }
      }
    };
  }, [wakeWord, onWakeWordDetected, isListening, enabled]);
  
  // Start wake word detection
  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isBrowserSupported || !enabled) return;
    
    try {
      recognitionRef.current.start();
      setIsListening(true);
      setError(null);
    } catch (error) {
      // If already started, ignore the error
      if (error instanceof Error && error.message.includes('already started')) {
        setIsListening(true);
        return;
      }
      console.error('Failed to start speech recognition:', error);
      setError('Failed to start speech recognition');
    }
  }, [isBrowserSupported, enabled]);
  
  // Stop wake word detection
  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
      setIsListening(false);
    } catch (error) {
      console.error('Failed to stop speech recognition:', error);
    }
  }, []);
  
  // Enable/disable detection based on enabled prop
  useEffect(() => {
    if (enabled && !isListening && isBrowserSupported) {
      startListening();
    } else if (!enabled && isListening) {
      stopListening();
    }
  }, [enabled, isListening, isBrowserSupported, startListening, stopListening]);
  
  return {
    isListening,
    error,
    isBrowserSupported,
    startListening,
    stopListening
  };
} 