'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ACORD126FormComponent } from '@/components/forms/acord126-form';
import { ACORD126Form } from '@/types/acord126';
import { useUser, UserButton } from '@clerk/nextjs';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CompanyACORD126Page() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;

  const [companyData, setCompanyData] = useState<{name: string, industry: string} | null>(null);
  const [formData, setFormData] = useState<ACORD126Form | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!companyId || !isSignedIn) return;

    const fetchCompanyAndGenerateForm = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch company details
        const companyResponse = await fetch(`/api/companies?page=1&limit=1000`);
        const companyData = await companyResponse.json();
        
        if (!companyData.success) {
          console.warn('Failed to fetch company details');
        } else {
          const company = companyData.data.find((c: any) => c.id === companyId);
          
          if (company) {
            setCompanyData({
              name: company.name,
              industry: company.industry
            });
          } else {
            console.warn(`Company with ID ${companyId} not found, but will continue to check for memory data`);
            setCompanyData({
              name: `Company ID: ${companyId}`,
              industry: 'Unknown'
            });
          }
        }
        
        // Generate ACORD126 form
        const formResponse = await fetch('/api/form-generation-126', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ companyId }),
        });
        
        if (!formResponse.ok) {
          const errorData = await formResponse.json();
          throw new Error(errorData.error || `Failed to generate form: ${formResponse.status}`);
        }
        
        const formResult = await formResponse.json();
        
        if (!formResult.success) {
          throw new Error(formResult.error || 'Failed to generate form');
        }
        
        // Set form data from response
        setFormData(formResult.data);
      } catch (err) {
        console.error('Error in form generation process:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyAndGenerateForm();
  }, [companyId, isSignedIn]);

  const handleFormUpdate = (updates: Partial<ACORD126Form>) => {
    if (!formData) return;
    
    setFormData({
      ...formData,
      ...updates
    });
  };

  const handleBackClick = () => {
    router.push('/companies');
  };

  const handleSaveForm = async () => {
    if (!formData) return;
    
    try {
      const response = await fetch('/api/forms/acord126', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save form: ${response.statusText}`);
      }
      
      alert('Form saved successfully!');
    } catch (err) {
      console.error('Error saving form:', err);
      alert(`Error saving form: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
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
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">ACORD 126 Form Generator</h1>
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
          <div className="mb-8 flex justify-between items-center">
            <Button
              variant="ghost"
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              onClick={handleBackClick}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to companies
            </Button>
            
            <Button 
              onClick={handleSaveForm}
              disabled={!formData || loading}
            >
              Save Form
            </Button>
          </div>

          <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              {companyData ? companyData.name : 'Loading company...'}
            </h2>
            {companyData && companyData.industry && (
              <p className="text-sm text-gray-500 dark:text-gray-400">Industry: {companyData.industry}</p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">ID: {companyId}</p>
          </div>

          {loading && (
            <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg shadow-md animate-pulse">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600 dark:text-blue-400" />
              <p className="mt-4 text-lg font-medium">Generating ACORD 126 form...</p>
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <div className="max-h-[800px] overflow-y-auto p-6">
                <ACORD126FormComponent 
                  formData={formData} 
                  onEditForm={handleFormUpdate} 
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="mt-20 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6">
        <div className="container text-center text-sm text-gray-500 dark:text-gray-400">
          <p>ACORD 126 Form Generator</p>
          <p className="mt-2">© {new Date().getFullYear()} Insurance Forms</p>
        </div>
      </footer>
    </main>
  );
} 