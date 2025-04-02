import React from 'react';
import { FormProvider } from './FormProvider';
import FormSidebar from './FormSidebar';
import { ConversationInterface } from './conversation-interface';
import FormControls from './FormControls';
import { InsuranceForm } from '@/types';

interface FormPageProps {
  initialForm?: InsuranceForm;
  debug?: boolean;
}

export default function FormPage({ initialForm, debug = false }: FormPageProps) {
  return (
    <FormProvider initialForm={initialForm} debug={debug}>
      <div className="flex flex-col h-screen">
        <div className="container py-4 border-b bg-gray-50">
          <FormControls />
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          <FormSidebar className="w-1/3 border-r" />
          <ConversationInterface className="w-2/3" />
        </div>
      </div>
    </FormProvider>
  );
} 