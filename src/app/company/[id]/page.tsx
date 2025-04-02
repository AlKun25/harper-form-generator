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
import { FormProvider } from '@/components/forms/FormProvider';

// Adapter function to map InsuranceForm updates back to ACORD125Form
const adaptFromInsuranceForm = (updates: Partial<InsuranceForm>, acord125: ACORD125Form): Partial<ACORD125Form> => {
  // Define a typed result object
  const result: Partial<ACORD125Form> = {};
  
  // Create address information if any address-related fields are updated
  if (updates.address !== undefined || updates.city !== undefined || 
      updates.state !== undefined || updates.zipCode !== undefined) {
    
    // Ensure all required objects exist
    if (!result.applicant_information) {
      result.applicant_information = {
        named_insured: {
          name: acord125.applicant_information.named_insured.name,
          mailing_address: {
            street_address: updates.address || acord125.applicant_information.named_insured.mailing_address.street_address,
            city: updates.city || acord125.applicant_information.named_insured.mailing_address.city,
            state: updates.state || acord125.applicant_information.named_insured.mailing_address.state,
            zip: updates.zipCode || acord125.applicant_information.named_insured.mailing_address.zip
          },
          gl_code: acord125.applicant_information.named_insured.gl_code,
          sic: acord125.applicant_information.named_insured.sic,
          naics: acord125.applicant_information.named_insured.naics,
          fein_or_soc_sec: acord125.applicant_information.named_insured.fein_or_soc_sec,
          business_phone: acord125.applicant_information.named_insured.business_phone,
          website_address: acord125.applicant_information.named_insured.website_address,
          entity_type: acord125.applicant_information.named_insured.entity_type
        }
      };
    } else if (!result.applicant_information.named_insured) {
      result.applicant_information.named_insured = {
        ...acord125.applicant_information.named_insured,
        mailing_address: {
          street_address: updates.address || acord125.applicant_information.named_insured.mailing_address.street_address,
          city: updates.city || acord125.applicant_information.named_insured.mailing_address.city,
          state: updates.state || acord125.applicant_information.named_insured.mailing_address.state,
          zip: updates.zipCode || acord125.applicant_information.named_insured.mailing_address.zip
        }
      };
    } else if (!result.applicant_information.named_insured.mailing_address) {
      result.applicant_information.named_insured.mailing_address = {
        street_address: updates.address || acord125.applicant_information.named_insured.mailing_address.street_address,
        city: updates.city || acord125.applicant_information.named_insured.mailing_address.city,
        state: updates.state || acord125.applicant_information.named_insured.mailing_address.state,
        zip: updates.zipCode || acord125.applicant_information.named_insured.mailing_address.zip
      };
    } else {
      // Update individual properties if they exist in updates
  if (updates.address !== undefined) {
    result.applicant_information.named_insured.mailing_address.street_address = updates.address;
  }
  if (updates.city !== undefined) {
    result.applicant_information.named_insured.mailing_address.city = updates.city;
  }
  if (updates.state !== undefined) {
    result.applicant_information.named_insured.mailing_address.state = updates.state;
  }
  if (updates.zipCode !== undefined) {
    result.applicant_information.named_insured.mailing_address.zip = updates.zipCode;
      }
    }
  }

  // Handle company name update
  if (updates.companyName !== undefined) {
    if (!result.applicant_information) {
      result.applicant_information = {
        named_insured: {
          ...acord125.applicant_information.named_insured,
          name: updates.companyName
        }
      };
    } else if (!result.applicant_information.named_insured) {
      result.applicant_information.named_insured = {
        ...acord125.applicant_information.named_insured,
        name: updates.companyName
      };
    } else {
      result.applicant_information.named_insured.name = updates.companyName;
    }
  }

  // Handle industry update
  if (updates.industry !== undefined) {
    if (!result.applicant_information) {
      result.applicant_information = {
        named_insured: {
          ...acord125.applicant_information.named_insured,
          sic: updates.industry
        }
      };
    } else if (!result.applicant_information.named_insured) {
      result.applicant_information.named_insured = {
        ...acord125.applicant_information.named_insured,
        sic: updates.industry
      };
    } else {
      result.applicant_information.named_insured.sic = updates.industry;
    }
  }

  // Handle premises information updates
  if (updates.employeeCount !== undefined || updates.annualRevenue !== undefined || updates.additionalNotes !== undefined) {
    if (!result.premises_information) {
      result.premises_information = {
        location: {
          street: acord125.premises_information.location.street,
          city: acord125.premises_information.location.city,
          state: acord125.premises_information.location.state,
          zip: acord125.premises_information.location.zip,
          interest: acord125.premises_information.location.interest,
          full_time_employees: acord125.premises_information.location.full_time_employees,
          part_time_employees: acord125.premises_information.location.part_time_employees,
          annual_revenues: acord125.premises_information.location.annual_revenues,
          description_of_operations: acord125.premises_information.location.description_of_operations
        }
      };
    } else if (!result.premises_information.location) {
      result.premises_information.location = {
        street: acord125.premises_information.location.street,
        city: acord125.premises_information.location.city,
        state: acord125.premises_information.location.state,
        zip: acord125.premises_information.location.zip,
        interest: acord125.premises_information.location.interest,
        full_time_employees: acord125.premises_information.location.full_time_employees,
        part_time_employees: acord125.premises_information.location.part_time_employees,
        annual_revenues: acord125.premises_information.location.annual_revenues,
        description_of_operations: acord125.premises_information.location.description_of_operations
      };
    }

    // Since we've guaranteed that the location object exists, we can directly update it
    if (updates.employeeCount !== undefined) {
      result.premises_information.location.full_time_employees = updates.employeeCount;
    }
    if (updates.annualRevenue !== undefined) {
      result.premises_information.location.annual_revenues = updates.annualRevenue;
    }
    if (updates.additionalNotes !== undefined) {
      result.premises_information.location.description_of_operations = updates.additionalNotes;
    }
  }

  // Handle policy information updates
  if (updates.effectiveDate !== undefined || updates.expirationDate !== undefined || updates.premiumAmount !== undefined) {
    if (!result.policy_information) {
      result.policy_information = {
        proposed_eff_date: acord125.policy_information.proposed_eff_date,
        proposed_exp_date: acord125.policy_information.proposed_exp_date,
        billing_plan: acord125.policy_information.billing_plan,
        payment_plan: acord125.policy_information.payment_plan,
        policy_premium: acord125.policy_information.policy_premium
      };
  }
  
  if (updates.effectiveDate !== undefined) {
    result.policy_information.proposed_eff_date = updates.effectiveDate;
  }
  if (updates.expirationDate !== undefined) {
    result.policy_information.proposed_exp_date = updates.expirationDate;
  }
  if (updates.premiumAmount !== undefined) {
    result.policy_information.policy_premium = updates.premiumAmount;
    }
  }

  // Handle contact information updates
  if (updates.contactName !== undefined || updates.contactEmail !== undefined || updates.contactPhone !== undefined) {
    if (!result.contact_information) {
      result.contact_information = {
        contact_name: acord125.contact_information.contact_name,
        primary_phone: acord125.contact_information.primary_phone,
        primary_email: acord125.contact_information.primary_email
      };
    }

    if (updates.contactName !== undefined) {
      result.contact_information.contact_name = updates.contactName;
    }
    if (updates.contactEmail !== undefined) {
      result.contact_information.primary_email = updates.contactEmail;
    }
    if (updates.contactPhone !== undefined) {
      result.contact_information.primary_phone = updates.contactPhone;
    }
  }

  // Handle year founded update
  if (updates.yearFounded !== undefined) {
    if (!result.nature_of_business) {
      result.nature_of_business = {
        business_type: acord125.nature_of_business.business_type,
        date_business_started: updates.yearFounded.toString(),
        description_primary_operations: acord125.nature_of_business.description_primary_operations
      };
    } else {
      result.nature_of_business.date_business_started = updates.yearFounded.toString();
    }
  }
  
  return result;
};

// Adapter function to convert ACORD125Form to simplified InsuranceForm 
// Only passing the most relevant fields
const adaptToInsuranceForm = (acord125: ACORD125Form): InsuranceForm => {
  // Create a complete InsuranceForm with all required fields
  return {
    companyName: acord125.applicant_information.named_insured.name || '',
    address: acord125.applicant_information.named_insured.mailing_address.street_address || '',
    city: acord125.applicant_information.named_insured.mailing_address.city || '',
    state: acord125.applicant_information.named_insured.mailing_address.state || '',
    zipCode: acord125.applicant_information.named_insured.mailing_address.zip || '',
    industry: acord125.applicant_information.named_insured.sic || '',
    contactName: acord125.contact_information.contact_name || '',
    contactEmail: acord125.contact_information.primary_email || '',
    contactPhone: acord125.contact_information.primary_phone || '',
    // Include these fields with default values if they don't exist
    employeeCount: acord125.premises_information?.location?.full_time_employees || 0,
    annualRevenue: acord125.premises_information?.location?.annual_revenues || 0,
    yearFounded: 0, // Default value
    deductibleAmount: 0, // Default value
    coverageLimit: 0, // Default value
    effectiveDate: acord125.policy_information?.proposed_eff_date || '',
    expirationDate: acord125.policy_information?.proposed_exp_date || '',
    premiumAmount: acord125.policy_information?.policy_premium || 0,
    additionalNotes: acord125.premises_information?.location?.description_of_operations || ''
  };
};

// Create a conversation wrapper that doesn't rely on the FormProvider
function ConversationWrapper({ 
  formData, 
  onUpdateForm, 
  companyId, 
  debug 
}: { 
  formData: InsuranceForm; 
  onUpdateForm: (updates: Partial<InsuranceForm>) => void; 
  companyId: string; 
  debug?: boolean 
}) {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([
    {
      role: 'assistant',
      content: 'Hello! I\'m Harper from Harper Insurance. How can I assist with your insurance application today?'
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const processMessage = async (message: string) => {
    if (!message.trim() || isProcessing) return;

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setIsProcessing(true);

    try {
      // Process message with API
      const response = await fetch('/api/form-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          formData,
          companyId,
          debug
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Server error');
      }

      // Apply updates if any
      const { updates, explanation } = result.data;
      if (updates && Object.keys(updates).length > 0) {
        if (debug) {
          console.log('FormAgent - Applying updates:', updates);
        }
        onUpdateForm(updates);
      }

      // Add assistant response
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: explanation || "I've processed your request." 
      }]);
    } catch (error) {
      console.error('Error in form agent:', error);
      
      // Add error message
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your request. Please try again.' 
      }]);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <ConversationInterface 
      className="h-[500px]"
      messages={messages}
      isProcessingMessage={isProcessing}
      sendMessage={processMessage}
    />
  );
}

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
  const [dataFetched, setDataFetched] = useState<boolean>(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    // If we've already fetched the data or required conditions aren't met, don't fetch again
    if (!companyId || !isSignedIn || dataFetched) return;

    // Check session storage for a fetch flag to prevent redundant fetches on reload
    const fetchFlagKey = `fetched_company_${companyId}`;
    const formDataKey = `form_data_company_${companyId}`;
    const companyDataKey = `company_data_${companyId}`;
    const alreadyFetched = sessionStorage.getItem(fetchFlagKey);
    
    if (alreadyFetched) {
      console.log(`Using cached data for company ID: ${companyId}`);
      
      // Try to load cached data from sessionStorage
      try {
        const cachedFormData = sessionStorage.getItem(formDataKey);
        const cachedCompanyData = sessionStorage.getItem(companyDataKey);
        
        if (cachedFormData) {
          setFormData(JSON.parse(cachedFormData));
        }
        
        if (cachedCompanyData) {
          setCompanyData(JSON.parse(cachedCompanyData));
        }
        
        setDataFetched(true);
        setLoading(false);
      } catch (error) {
        console.error("Error loading cached data:", error);
        // If there's an error with cached data, we'll continue with a fresh fetch
        sessionStorage.removeItem(fetchFlagKey);
        sessionStorage.removeItem(formDataKey);
        sessionStorage.removeItem(companyDataKey);
        // We don't set dataFetched true here to allow the fetch to proceed
      }
      return;
    }

    let isMounted = true;
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
        
        let companyInfo = null;
        if (!company) {
          console.warn(`Company with ID ${companyId} not found, but will continue to check for memory data`);
          companyExists = false;
        } else {
          companyInfo = {
            name: company.name,
            industry: company.industry
          };
          setCompanyData(companyInfo);
        }
        
        // Fetch company memory - even if company doesn't exist
        console.log(`Fetching memory data for company ID: ${companyId}`);
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
            companyInfo = {
              name: `Memory Only (ID: ${companyId})`,
              industry: 'Unknown'
            };
            setCompanyData(companyInfo);
          }
        }
        
        // Generate form with AI - will work if either company or memory exists
        // Pass along the memory data to avoid a redundant API call
        const formResponse = await fetch('/api/form-generation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            companyId,
            // Include the memory data if we have it to avoid another fetch
            ...(memoryData.success ? { memoryData } : {})
          }),
        });
        
        const formResult = await formResponse.json();
        
        if (!formResult.success) {
          throw new Error(formResult.error || 'Failed to generate form');
        }
        
        // Mark that we've successfully fetched the data
        if (isMounted) {
          // Store company and form data
          const formData = formResult.data;
          setFormData(formData);
          setDataFetched(true);
          
          // Cache data in sessionStorage for future page reloads
          try {
            sessionStorage.setItem(formDataKey, JSON.stringify(formData));
            if (companyInfo) {
              sessionStorage.setItem(companyDataKey, JSON.stringify(companyInfo));
            }
            sessionStorage.setItem(fetchFlagKey, 'true');
          } catch (error) {
            console.error("Error caching data in sessionStorage:", error);
            // Continue anyway, not critical if caching fails
          }
        }
      } catch (err) {
        if (isMounted) {
        console.error('Error in form generation process:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        }
      } finally {
        if (isMounted) {
        setLoading(false);
        }
      }
    };

    fetchCompanyAndGenerateForm();

    // Cleanup function to handle unmounting
    return () => {
      isMounted = false;
    };
  }, [companyId, isSignedIn, dataFetched]);

  // Clear cache and reset state when company ID changes
  useEffect(() => {
    setDataFetched(false);
    setCompanyData(null);
    setFormData(null);
    setCompanyMemory(null);
    
    // Clear the session storage for previous company IDs if needed
    const previousCompanyId = sessionStorage.getItem('current_company_id');
    if (previousCompanyId && previousCompanyId !== companyId) {
      sessionStorage.removeItem(`fetched_company_${previousCompanyId}`);
      sessionStorage.removeItem(`form_data_company_${previousCompanyId}`);
      sessionStorage.removeItem(`company_data_${previousCompanyId}`);
    }
    sessionStorage.setItem('current_company_id', companyId);
  }, [companyId]);

  const handleFormUpdate = (updates: Partial<ACORD125Form>) => {
    if (!formData) return;
    
    // Apply updates directly without unnecessary deep cloning
    setFormData(prevData => {
      if (!prevData) return prevData;
      
      // Create shallow copy of form data
      const updatedData = { ...prevData };
      
      // Apply updates section by section to avoid full deep clones
      Object.keys(updates).forEach(sectionKey => {
        const section = sectionKey as keyof ACORD125Form;
        
        // Type-safe handling of specific known sections
        if (section === 'applicant_information' && updates.applicant_information) {
          if (!updatedData.applicant_information) {
            updatedData.applicant_information = { 
              named_insured: prevData.applicant_information.named_insured
            };
          }
          
          // Manually merge named_insured if it exists
          if (updates.applicant_information.named_insured) {
            if (!updatedData.applicant_information.named_insured) {
              updatedData.applicant_information.named_insured = prevData.applicant_information.named_insured;
            }
            
            // Merge properties at the named_insured level
            Object.assign(
              updatedData.applicant_information.named_insured, 
              updates.applicant_information.named_insured
            );
            
            // Special handling for mailing_address if it exists
            if (updates.applicant_information.named_insured.mailing_address) {
              if (!updatedData.applicant_information.named_insured.mailing_address) {
                updatedData.applicant_information.named_insured.mailing_address = 
                  prevData.applicant_information.named_insured.mailing_address;
              }
              
              // Merge mailing_address properties
              Object.assign(
                updatedData.applicant_information.named_insured.mailing_address,
                updates.applicant_information.named_insured.mailing_address
              );
            }
          }
        } 
        else if (section === 'premises_information' && updates.premises_information) {
          if (!updatedData.premises_information) {
            updatedData.premises_information = { 
              location: prevData.premises_information.location 
            };
          }
          
          // Merge location if it exists
          if (updates.premises_information.location) {
            if (!updatedData.premises_information.location) {
              updatedData.premises_information.location = prevData.premises_information.location;
            }
            
            // Merge location properties
            Object.assign(
              updatedData.premises_information.location,
              updates.premises_information.location
            );
          }
        }
        else if (section === 'policy_information' && updates.policy_information) {
          if (!updatedData.policy_information) {
            updatedData.policy_information = prevData.policy_information;
          }
          
          // Merge policy_information properties
          Object.assign(
            updatedData.policy_information,
            updates.policy_information
          );
        }
        else if (section === 'contact_information' && updates.contact_information) {
          if (!updatedData.contact_information) {
            updatedData.contact_information = prevData.contact_information;
          }
          
          // Merge contact_information properties
          Object.assign(
            updatedData.contact_information,
            updates.contact_information
          );
        }
        else if (section === 'nature_of_business' && updates.nature_of_business) {
          if (!updatedData.nature_of_business) {
            updatedData.nature_of_business = prevData.nature_of_business;
          }
          
          // Merge nature_of_business properties
          Object.assign(
            updatedData.nature_of_business,
            updates.nature_of_business
          );
        }
        else {
          // Handle any other section (fallback) - be explicit about typing
          if (section === 'agency' && updates.agency) {
            if (!updatedData.agency) {
              updatedData.agency = prevData.agency;
            }
            Object.assign(updatedData.agency, updates.agency);
          } 
          else if (section === 'carrier' && updates.carrier) {
            if (!updatedData.carrier) {
              updatedData.carrier = prevData.carrier;
            }
            Object.assign(updatedData.carrier, updates.carrier);
          }
          else if (section === 'status_of_transaction' && updates.status_of_transaction) {
            if (!updatedData.status_of_transaction) {
              updatedData.status_of_transaction = prevData.status_of_transaction;
            }
            Object.assign(updatedData.status_of_transaction, updates.status_of_transaction);
          }
          else if (section === 'date' && updates.date) {
            updatedData.date = updates.date;
          }
          else if (section === 'prior_carrier_information' && updates.prior_carrier_information) {
            if (!updatedData.prior_carrier_information) {
              updatedData.prior_carrier_information = prevData.prior_carrier_information;
            }
            Object.assign(updatedData.prior_carrier_information, updates.prior_carrier_information);
          }
          else if (section === 'loss_history' && updates.loss_history) {
            if (!updatedData.loss_history) {
              updatedData.loss_history = prevData.loss_history;
            }
            Object.assign(updatedData.loss_history, updates.loss_history);
          }
          else if (section === 'general_information' && updates.general_information) {
            if (!updatedData.general_information) {
              updatedData.general_information = prevData.general_information;
            }
            Object.assign(updatedData.general_information, updates.general_information);
          }
          // Skip any unknown sections
        }
      });
      
      // Update the session storage with the new form data
      try {
        const formDataKey = `form_data_company_${companyId}`;
        sessionStorage.setItem(formDataKey, JSON.stringify(updatedData));
      } catch (error) {
        console.error("Error updating session storage:", error);
      }
      
      return updatedData;
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
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">ACORD 125 Form</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Commercial Insurance Application</p>
                </div>
                <div className="overflow-y-auto p-6 max-h-[600px]">
                  <ACORD125FormComponent 
                    formData={formData} 
                    onEditForm={handleFormUpdate} 
                  />
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden sticky top-6 self-start">
                <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Insurance Advisor</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Get help with your application</p>
                </div>
                <div className="p-0">
                  <ConversationWrapper 
                    formData={adaptToInsuranceForm(formData)} 
                    onUpdateForm={(updates) => {
                      console.log("Received updates from form agent:", updates);
                      const acord125Updates = adaptFromInsuranceForm(updates, formData);
                      console.log("Converted to ACORD125 format:", acord125Updates);
                      handleFormUpdate(acord125Updates);
                    }}
                    companyId={companyId}
                    debug={true}
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