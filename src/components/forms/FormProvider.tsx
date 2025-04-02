import React, { createContext, useState, useContext, useMemo } from 'react';
import { InsuranceForm, FormInstance } from '@/types';
import useFormAgent from '@/hooks/useFormAgent';
import useFormTemplates from '@/hooks/useFormTemplates';

interface FormContextType {
  form: InsuranceForm;
  updateForm: (updates: Partial<InsuranceForm>) => void;
  resetForm: () => void;
  messages: Array<{ role: string; content: string }>;
  isProcessingMessage: boolean;
  currentSection?: string;
  sendMessage: (message: string) => Promise<void>;
  resetConversation: () => void;
  availableTemplates: FormInstance[];
  isLoadingTemplates: boolean;
  loadFormTemplate: (templateId: string) => Promise<void>;
  useLangGraph: boolean;
  toggleLangGraph: () => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

interface FormProviderProps {
  children: React.ReactNode;
  initialForm?: InsuranceForm;
  debug?: boolean;
  onFormUpdate?: (updates: Partial<InsuranceForm>) => void;
}

export function FormProvider({ children, initialForm, debug = false, onFormUpdate }: FormProviderProps) {
  const [form, setForm] = useState<InsuranceForm>(initialForm || {});
  const [useLangGraph, setUseLangGraph] = useState(false);

  const {
    availableTemplates,
    isLoading: isLoadingTemplates,
    loadTemplate
  } = useFormTemplates();

  const updateForm = (updates: Partial<InsuranceForm>) => {
    setForm(prev => ({
      ...prev,
      ...updates
    }));
    
    // If external update handler is provided, call it
    if (onFormUpdate) {
      onFormUpdate(updates);
    }
  };

  const resetForm = () => {
    setForm({});
  };

  const {
    messages,
    isProcessing: isProcessingMessage,
    currentSection,
    processMessage: sendMessage,
    resetConversation
  } = useFormAgent({
    initialFormData: form,
    onFormUpdate: updateForm,
    debug,
    useLangGraph
  });

  const loadFormTemplate = async (templateId: string) => {
    try {
      const template = await loadTemplate(templateId);
      if (template) {
        setForm(template.formData || {});
      }
    } catch (error) {
      console.error('Error loading template:', error);
    }
  };

  const toggleLangGraph = () => {
    setUseLangGraph(!useLangGraph);
    // Reset conversation when switching between implementations
    resetConversation();
  };

  const contextValue = useMemo(() => ({
    form,
    updateForm,
    resetForm,
    messages,
    isProcessingMessage,
    currentSection,
    sendMessage,
    resetConversation,
    availableTemplates,
    isLoadingTemplates,
    loadFormTemplate,
    useLangGraph,
    toggleLangGraph
  }), [
    form, 
    messages, 
    isProcessingMessage, 
    currentSection,
    availableTemplates, 
    isLoadingTemplates,
    useLangGraph
  ]);

  return (
    <FormContext.Provider value={contextValue}>
      {children}
    </FormContext.Provider>
  );
}

export function useFormContext() {
  const context = useContext(FormContext);
  if (context === undefined) {
    throw new Error('useFormContext must be used within a FormProvider');
  }
  return context;
} 