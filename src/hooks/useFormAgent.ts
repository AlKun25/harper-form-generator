import { useState, useEffect } from 'react';
import { InsuranceForm } from '@/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UseFormAgentOptions {
  initialFormData: InsuranceForm;
  onFormUpdate: (updates: Partial<InsuranceForm>) => void;
  companyId?: string;
  debug?: boolean;
  useLangGraph?: boolean;
}

interface UseFormAgentReturn {
  messages: Message[];
  isProcessing: boolean;
  currentSection?: string;
  processMessage: (userMessage: string) => Promise<void>;
  resetConversation: () => void;
}

/**
 * Custom hook that encapsulates the FormAgent functionality using server API
 * to process user messages and extract form updates
 */
export default function useFormAgent({
  initialFormData,
  onFormUpdate,
  companyId = '',
  debug = false,
  useLangGraph = false
}: UseFormAgentOptions): UseFormAgentReturn {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m Harper from Harper Insurance. How can I assist with your insurance application today?'
    }
  ]);
  const [formData, setFormData] = useState<InsuranceForm>(initialFormData);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentSection, setCurrentSection] = useState<string | undefined>(undefined);

  // Update internal form data when it changes externally
  useEffect(() => {
    if (JSON.stringify(formData) !== JSON.stringify(initialFormData)) {
      setFormData(initialFormData);
    }
  }, [initialFormData]);

  const processMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isProcessing) return;
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsProcessing(true);
    
    try {
      // Determine which API endpoint to use
      const apiEndpoint = useLangGraph ? '/api/form-agent-langraph' : '/api/form-agent';
      
      // Process the message with the server-side API
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          formData,
          companyId,
          debug
        }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Server error');
      }
      
      const { updates, explanation, currentSection: newSection } = result.data;
      
      // Update the current section if provided
      if (newSection && newSection !== currentSection) {
        setCurrentSection(newSection);
      }
      
      // Apply any form updates
      if (updates && Object.keys(updates).length > 0) {
        if (debug) {
          console.log(`FormAgent${useLangGraph ? ' LangGraph' : ''} - Applying updates:`, updates);
        }
        onFormUpdate(updates);
      }
      
      // Add assistant response to chat
      const responseText = explanation || "I've processed your request.";
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: responseText 
      }]);
    } catch (error) {
      console.error(`Error in form agent${useLangGraph ? ' LangGraph' : ''}:`, error);
      
      // Add error message to chat
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your request. Please try again.' 
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetConversation = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Hello! I\'m Harper from Harper Insurance. How can I assist with your insurance application today?'
      }
    ]);
    setCurrentSection(undefined);
  };

  return {
    messages,
    isProcessing,
    currentSection,
    processMessage,
    resetConversation,
  };
} 