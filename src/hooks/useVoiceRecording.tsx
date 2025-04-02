import { useRef, useState, useCallback } from 'react';

interface UseVoiceRecordingOptions {
  onTranscriptionComplete?: (transcript: string) => void;
  onTranscriptionStart?: () => void;
  onError?: (error: string) => void;
  debug?: boolean;
}

export function useVoiceRecording({
  onTranscriptionComplete,
  onTranscriptionStart,
  onError,
  debug = false
}: UseVoiceRecordingOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Stop all tracks in the current stream
  const stopMediaTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);
  
  // Toggle recording function (press to start, press again to stop)
  const toggleRecording = useCallback(async () => {
    if (debug) {
      console.log(`Voice Recording - Toggle recording. Current state: ${isRecording ? 'recording' : 'not recording'}`);
    }
    
    // If currently recording, stop it
    if (isRecording) {
      if (mediaRecorderRef.current) {
        if (debug) console.log('Voice Recording - Stopping recording');
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
      return;
    }
    
    // If not recording, start recording
    try {
      setError(null);
      
      // Stop any existing media tracks first
      stopMediaTracks();
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      if (onTranscriptionStart) {
        onTranscriptionStart();
      }
      
      // Create new MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      // Handle data as it becomes available
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      // Handle recording stop
      mediaRecorder.onstop = async () => {
        if (debug) console.log('Voice Recording - Recording stopped');
        
        // Update UI state
        setIsProcessing(true);
        
        try {
          // Create audio blob from chunks
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          if (debug) {
            console.log(`Voice Recording - Audio recorded, size: ${audioBlob.size} bytes`);
          }
          
          // Stop all tracks in the stream to release the microphone
          stopMediaTracks();
          
          // Skip processing if we got no audio data
          if (audioBlob.size === 0) {
            throw new Error('No audio recorded');
          }
          
          // Create FormData to send to API
          const formData = new FormData();
          formData.append('file', audioBlob, 'recording.webm');
          
          // Send to transcription API
          if (debug) console.log('Voice Recording - Sending to transcription API');
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) {
            throw new Error(`Error from transcription API: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (debug) {
            console.log('Voice Recording - Transcription received:', data);
          }
          
          if (data.text && onTranscriptionComplete) {
            onTranscriptionComplete(data.text);
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error during transcription';
          if (debug) console.error('Voice Recording - Error:', errorMessage);
          setError(errorMessage);
          if (onError) onError(errorMessage);
        } finally {
          setIsProcessing(false);
          mediaRecorderRef.current = null;
        }
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      
      if (debug) console.log('Voice Recording - Recording started');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Could not access microphone';
      if (debug) console.error('Voice Recording - Error:', errorMessage);
      setError(errorMessage);
      if (onError) onError(errorMessage);
      
      // Ensure we're not stuck in recording state
      setIsRecording(false);
      setIsProcessing(false);
    }
  }, [isRecording, onTranscriptionComplete, onTranscriptionStart, onError, stopMediaTracks, debug]);
  
  return {
    isRecording,
    isProcessing,
    error,
    toggleRecording
  };
} 