import { useState, useCallback, useRef } from 'react';

interface UseVoiceRecordingProps {
  onTranscriptionComplete: (text: string) => void;
  onAutoSubmit?: (text: string) => void;
}

export default function useVoiceRecording({ 
  onTranscriptionComplete, 
  onAutoSubmit 
}: UseVoiceRecordingProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldAutoSubmit, setShouldAutoSubmit] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setShouldAutoSubmit(false);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        setIsProcessing(true);
        
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // Create FormData to send the audio file
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          
          // Send the audio to the server for transcription
          const response = await fetch('/api/speech-to-text', {
            method: 'POST',
            body: formData,
          });
          
          const result = await response.json();
          
          if (!result.success) {
            throw new Error(result.error || 'Failed to transcribe audio');
          }
          
          const transcribedText = result.data.text;
          
          // Pass the transcribed text back
          onTranscriptionComplete(transcribedText);
          
          // If autoSubmit is enabled and we have a callback, call it with the transcribed text
          if (shouldAutoSubmit && onAutoSubmit && transcribedText.trim()) {
            onAutoSubmit(transcribedText);
          }
        } catch (error) {
          console.error('Error processing audio:', error);
          setError(error instanceof Error ? error.message : 'An unknown error occurred');
        } finally {
          setIsProcessing(false);
        }
        
        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      setError(error instanceof Error ? error.message : 'Failed to access microphone');
    }
  }, [onTranscriptionComplete, onAutoSubmit]);

  const stopRecording = useCallback((autoSubmit = false) => {
    if (mediaRecorderRef.current && isRecording) {
      // Set auto submit flag before stopping the recording
      setShouldAutoSubmit(autoSubmit);
      mediaRecorderRef.current.stop();
      // Note: the onstop event will handle the rest
    }
  }, [isRecording]);

  return {
    isRecording,
    isProcessing,
    error,
    startRecording,
    stopRecording
  };
} 