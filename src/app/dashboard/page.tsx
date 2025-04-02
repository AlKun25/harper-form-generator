'use client';

import { useState, useEffect } from 'react';
import { CompanySelector } from '@/components/company-selection/company-selector';
import { InsuranceForm } from '@/components/forms/insurance-form';
import { ConversationInterface } from '@/components/forms/conversation-interface';
import { InsuranceForm as InsuranceFormType } from '@/types';
import { useUser, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [companyMemory, setCompanyMemory] = useState<any>(null);
  const [formData, setFormData] = useState<InsuranceFormType | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  const handleSelectCompany = async (companyId: string) => {
    setSelectedCompanyId(companyId);
    setFormData(null);
    setLoading(true);
    setError(null);
    
    try {
      // Fetch company memory
      const memoryResponse = await fetch(`/api/memory?companyId=${companyId}`);
      const memoryData = await memoryResponse.json();
      
      if (!memoryData.success) {
        throw new Error(memoryData.error || 'Failed to fetch company memory');
      }
      
      setCompanyMemory(memoryData.data);
      
      // Generate form with AI
      const formResponse = await fetch('/api/form-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memory: memoryData.data }),
      });
      
      const formResult = await formResponse.json();
      
      if (!formResult.success) {
        throw new Error(formResult.error || 'Failed to generate form');
      }
      
      setFormData(formResult.data);
    } catch (err) {
      console.error('Error in form generation process:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFormUpdate = (updates: Partial<InsuranceFormType>) => {
    if (!formData) return;
    
    setFormData({
      ...formData,
      ...updates
    });
  };

  // If authentication is not loaded yet, show a loading indicator
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em]"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="container py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Harper Form Generator</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {user?.firstName ? `Welcome, ${user.firstName}` : user?.emailAddresses?.[0]?.emailAddress && `Welcome, ${user.emailAddresses[0]?.emailAddress}`}
              </span>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>
      
      <div className="container py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Select a Company</h2>
            <CompanySelector onSelectCompany={handleSelectCompany} />
          </div>

          {loading && (
            <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg shadow-md animate-pulse">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 dark:border-blue-400 border-r-transparent align-[-0.125em]"></div>
              <p className="mt-4 text-lg font-medium">Generating form with AI...</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">This may take a few moments</p>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-4 rounded-lg shadow-md mb-6">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          {formData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Generated Form</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Form data extracted from company information</p>
                </div>
                <div className="p-6">
                  <InsuranceForm 
                    formData={formData} 
                    onEditForm={handleFormUpdate} 
                  />
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Voice Assistant</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Modify the form using voice or text</p>
                </div>
                <div className="p-0">
                  <ConversationInterface 
                    formData={formData}
                    onUpdateForm={handleFormUpdate}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="mt-20 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6">
        <div className="container text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Harper Insurance Brokerage AI Form Generator</p>
          <p className="mt-2">© {new Date().getFullYear()} Harper Insurance</p>
        </div>
      </footer>
    </main>
  );
} 