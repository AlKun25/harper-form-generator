'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ACORD125FormComponent } from '@/components/forms/acord125-form';
import { ConversationInterface } from '@/components/forms/conversation-interface';
import { ACORD125Form } from '@/types/acord125';
import { InsuranceForm } from '@/types';
import { useUser, UserButton } from '@clerk/nextjs';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Adapter function to convert ACORD125Form to InsuranceForm
const adaptToInsuranceForm = (acord125: ACORD125Form): InsuranceForm => {
  return {
    companyName: acord125.applicant_information.named_insured.name || '',
    address: acord125.applicant_information.named_insured.mailing_address.street_address || '',
    city: acord125.applicant_information.named_insured.mailing_address.city || '',
    state: acord125.applicant_information.named_insured.mailing_address.state || '',
    zipCode: acord125.applicant_information.named_insured.mailing_address.zip || '',
    industry: acord125.applicant_information.named_insured.sic || '',
    employeeCount: acord125.premises_information.location.full_time_employees || 0,
    annualRevenue: acord125.premises_information.location.annual_revenues || 0,
    yearFounded: 0, // Not directly available in ACORD125
    deductibleAmount: 0, // Not directly available in ACORD125
    coverageLimit: 0, // Not directly available in ACORD125
    effectiveDate: acord125.policy_information.proposed_eff_date || '',
    expirationDate: acord125.policy_information.proposed_exp_date || '',
    premiumAmount: acord125.policy_information.policy_premium || 0,
    contactName: acord125.contact_information.contact_name || '',
    contactEmail: acord125.contact_information.primary_email || '',
    contactPhone: acord125.contact_information.primary_phone || '',
    additionalNotes: acord125.premises_information.location.description_of_operations || ''
  };
};

// Adapter function to map InsuranceForm updates back to ACORD125Form
const adaptFromInsuranceForm = (updates: Partial<InsuranceForm>, acord125: ACORD125Form): Partial<ACORD125Form> => {
  const result: Partial<ACORD125Form> = {};
  
  if (updates.companyName !== undefined) {
    if (!result.applicant_information) result.applicant_information = { ...acord125.applicant_information };
    if (!result.applicant_information.named_insured) result.applicant_information.named_insured = { ...acord125.applicant_information.named_insured };
    result.applicant_information.named_insured.name = updates.companyName;
  }
  
  if (updates.address !== undefined) {
    if (!result.applicant_information) result.applicant_information = { ...acord125.applicant_information };
    if (!result.applicant_information.named_insured) result.applicant_information.named_insured = { ...acord125.applicant_information.named_insured };
    if (!result.applicant_information.named_insured.mailing_address) result.applicant_information.named_insured.mailing_address = { ...acord125.applicant_information.named_insured.mailing_address };
    result.applicant_information.named_insured.mailing_address.street_address = updates.address;
  }
  
  if (updates.city !== undefined) {
    if (!result.applicant_information) result.applicant_information = { ...acord125.applicant_information };
    if (!result.applicant_information.named_insured) result.applicant_information.named_insured = { ...acord125.applicant_information.named_insured };
    if (!result.applicant_information.named_insured.mailing_address) result.applicant_information.named_insured.mailing_address = { ...acord125.applicant_information.named_insured.mailing_address };
    result.applicant_information.named_insured.mailing_address.city = updates.city;
  }
  
  if (updates.state !== undefined) {
    if (!result.applicant_information) result.applicant_information = { ...acord125.applicant_information };
    if (!result.applicant_information.named_insured) result.applicant_information.named_insured = { ...acord125.applicant_information.named_insured };
    if (!result.applicant_information.named_insured.mailing_address) result.applicant_information.named_insured.mailing_address = { ...acord125.applicant_information.named_insured.mailing_address };
    result.applicant_information.named_insured.mailing_address.state = updates.state;
  }
  
  if (updates.zipCode !== undefined) {
    if (!result.applicant_information) result.applicant_information = { ...acord125.applicant_information };
    if (!result.applicant_information.named_insured) result.applicant_information.named_insured = { ...acord125.applicant_information.named_insured };
    if (!result.applicant_information.named_insured.mailing_address) result.applicant_information.named_insured.mailing_address = { ...acord125.applicant_information.named_insured.mailing_address };
    result.applicant_information.named_insured.mailing_address.zip = updates.zipCode;
  }
  
  if (updates.contactName !== undefined) {
    if (!result.contact_information) result.contact_information = { ...acord125.contact_information };
    result.contact_information.contact_name = updates.contactName;
  }
  
  if (updates.contactEmail !== undefined) {
    if (!result.contact_information) result.contact_information = { ...acord125.contact_information };
    result.contact_information.primary_email = updates.contactEmail;
  }
  
  if (updates.contactPhone !== undefined) {
    if (!result.contact_information) result.contact_information = { ...acord125.contact_information };
    result.contact_information.primary_phone = updates.contactPhone;
  }
  
  if (updates.effectiveDate !== undefined) {
    if (!result.policy_information) result.policy_information = { ...acord125.policy_information };
    result.policy_information.proposed_eff_date = updates.effectiveDate;
  }
  
  if (updates.expirationDate !== undefined) {
    if (!result.policy_information) result.policy_information = { ...acord125.policy_information };
    result.policy_information.proposed_exp_date = updates.expirationDate;
  }
  
  if (updates.premiumAmount !== undefined) {
    if (!result.policy_information) result.policy_information = { ...acord125.policy_information };
    result.policy_information.policy_premium = updates.premiumAmount;
  }
  
  if (updates.employeeCount !== undefined) {
    if (!result.premises_information) result.premises_information = { ...acord125.premises_information };
    if (!result.premises_information.location) result.premises_information.location = { ...acord125.premises_information.location };
    result.premises_information.location.full_time_employees = updates.employeeCount;
  }
  
  if (updates.annualRevenue !== undefined) {
    if (!result.premises_information) result.premises_information = { ...acord125.premises_information };
    if (!result.premises_information.location) result.premises_information.location = { ...acord125.premises_information.location };
    result.premises_information.location.annual_revenues = updates.annualRevenue;
  }
  
  if (updates.additionalNotes !== undefined) {
    if (!result.premises_information) result.premises_information = { ...acord125.premises_information };
    if (!result.premises_information.location) result.premises_information.location = { ...acord125.premises_information.location };
    result.premises_information.location.description_of_operations = updates.additionalNotes;
  }
  
  return result;
};

export default function CompanyPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;

  const [companyData, setCompanyData] = useState<{name: string, industry: string} | null>(null);
  const [companyMemory, setCompanyMemory] = useState<any>(null);
  const [formData, setFormData] = useState<ACORD125Form | null>(null);
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
        let companyExists = true;
        // Fetch company details
        const companyResponse = await fetch(`/api/companies?page=1&limit=1000`);
        const companyData = await companyResponse.json();
        
        if (!companyData.success) {
          console.warn('Failed to fetch company details');
          companyExists = false;
        }
        
        const company = companyData.success ? companyData.data.find((c: any) => c.id === companyId) : null;
        
        if (!company) {
          console.warn(`Company with ID ${companyId} not found, but will continue to check for memory data`);
          companyExists = false;
        } else {
          setCompanyData({
            name: company.name,
            industry: company.industry
          });
        }
        
        // Fetch company memory - even if company doesn't exist
        const memoryResponse = await fetch(`/api/memory?companyId=${companyId}`);
        const memoryData = await memoryResponse.json();
        
        if (!memoryData.success) {
          // If both company and memory don't exist, throw an error
          if (!companyExists) {
            throw new Error(`Company with ID ${companyId} not found and no memory data available`);
          }
          // Otherwise just log a warning - we can still continue with company data only
          console.warn(memoryData.error || 'Failed to fetch company memory');
        } else {
          // Memory data exists
          setCompanyMemory(memoryData.data);
          
          // Handle case where company doesn't exist but memory does
          if (!companyExists) {
            setCompanyData({
              name: `Memory Only (ID: ${companyId})`,
              industry: 'Unknown'
            });
          }
        }
        
        // Generate form with AI - will work if either company or memory exists
        const formResponse = await fetch('/api/form-generation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ companyId }),
        });
        
        const formResult = await formResponse.json();
        
        if (!formResult.success) {
          throw new Error(formResult.error || 'Failed to generate form');
        }
        
        // Set form data from response (accessing the data property)
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

  const handleFormUpdate = (updates: Partial<ACORD125Form>) => {
    if (!formData) return;
    
    setFormData({
      ...formData,
      ...updates
    });
  };

  const handleBackClick = () => {
    router.push('/companies');
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
          <div className="mb-8">
            <Button
              variant="ghost"
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              onClick={handleBackClick}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to companies
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <div className="max-h-[800px] overflow-y-auto p-6">
                  <ACORD125FormComponent 
                    formData={formData} 
                    onEditForm={handleFormUpdate} 
                  />
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <ConversationInterface 
                  formData={adaptToInsuranceForm(formData)} 
                  onUpdateForm={(updates) => {
                    const acord125Updates = adaptFromInsuranceForm(updates, formData);
                    handleFormUpdate(acord125Updates);
                  }} 
                />
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