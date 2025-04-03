'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ACORD125FormComponent } from '@/components/forms/acord125-form';
import { ACORD126FormComponent } from '@/components/forms/acord126-form';
import { ConversationInterface } from '@/components/forms/conversation-interface';
import { ACORD125Form } from '@/types/acord125';
import { ACORD126Form } from '@/types/acord126';
import { InsuranceForm } from '@/types';
import { useUser, UserButton } from '@clerk/nextjs';
import { ArrowLeft, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { downloadPdf } from '@/lib/utils';

// Adapter function to convert ACORD125Form to InsuranceForm
const adaptToInsuranceForm = (acord125: any): InsuranceForm => {
  return {
    companyName: acord125.applicant_information?.named_insured?.name || '',
    address: acord125.applicant_information?.named_insured?.mailing_address?.street_address || '',
    city: acord125.applicant_information?.named_insured?.mailing_address?.city || '',
    state: acord125.applicant_information?.named_insured?.mailing_address?.state || '',
    zipCode: acord125.applicant_information?.named_insured?.mailing_address?.zip || '',
    industry: acord125.applicant_information?.named_insured?.sic || '',
    employeeCount: acord125.premises_information?.location?.full_time_employees || 0,
    annualRevenue: acord125.premises_information?.location?.annual_revenues || 0,
    yearFounded: 0, // Not directly available in ACORD125
    deductibleAmount: 0, // Not directly available in ACORD125
    coverageLimit: 0, // Not directly available in ACORD125
    effectiveDate: acord125.policy_information?.proposed_eff_date || '',
    expirationDate: acord125.policy_information?.proposed_exp_date || '',
    premiumAmount: acord125.policy_information?.policy_premium || 0,
    contactName: acord125.contact_information?.contact_name || '',
    contactEmail: acord125.contact_information?.primary_email || '',
    contactPhone: acord125.contact_information?.primary_phone || '',
    additionalNotes: acord125.premises_information?.location?.description_of_operations || ''
  };
};

// Adapter function to convert InsuranceForm updates back to ACORD125Form structure
const adaptFromInsuranceForm = (updates: Partial<InsuranceForm> & Record<string, any>, formData: any): any => {
  const acord125Updates: any = {};
  
  console.log('Adapting updates from InsuranceForm to ACORD125Form:', updates);
  
  // Special handling for direct field updates which come directly from the AI
  // These fields might not be in the InsuranceForm type but are in the ACORD125 structure
  if (updates.hasOwnProperty('agency_information')) {
    acord125Updates.agency = updates.agency_information;
    console.log('Special field detected: agency_information mapped to agency', acord125Updates);
  }
  
  if (updates.hasOwnProperty('contact_information')) {
    acord125Updates.contact_information = updates.contact_information;
    console.log('Contact information field passed through directly', acord125Updates);
  }
  
  // Map each field from InsuranceForm to ACORD125Form structure
  if (updates.companyName !== undefined) {
    if (!acord125Updates.applicant_information) acord125Updates.applicant_information = {};
    if (!acord125Updates.applicant_information.named_insured) acord125Updates.applicant_information.named_insured = {};
    acord125Updates.applicant_information.named_insured.name = updates.companyName;
  }
  
  if (updates.address !== undefined) {
    if (!acord125Updates.applicant_information) acord125Updates.applicant_information = {};
    if (!acord125Updates.applicant_information.named_insured) acord125Updates.applicant_information.named_insured = {};
    if (!acord125Updates.applicant_information.named_insured.mailing_address) acord125Updates.applicant_information.named_insured.mailing_address = {};
    acord125Updates.applicant_information.named_insured.mailing_address.street_address = updates.address;
  }
  
  if (updates.city !== undefined) {
    if (!acord125Updates.applicant_information) acord125Updates.applicant_information = {};
    if (!acord125Updates.applicant_information.named_insured) acord125Updates.applicant_information.named_insured = {};
    if (!acord125Updates.applicant_information.named_insured.mailing_address) acord125Updates.applicant_information.named_insured.mailing_address = {};
    acord125Updates.applicant_information.named_insured.mailing_address.city = updates.city;
  }
  
  if (updates.state !== undefined) {
    if (!acord125Updates.applicant_information) acord125Updates.applicant_information = {};
    if (!acord125Updates.applicant_information.named_insured) acord125Updates.applicant_information.named_insured = {};
    if (!acord125Updates.applicant_information.named_insured.mailing_address) acord125Updates.applicant_information.named_insured.mailing_address = {};
    acord125Updates.applicant_information.named_insured.mailing_address.state = updates.state;
  }
  
  if (updates.zipCode !== undefined) {
    if (!acord125Updates.applicant_information) acord125Updates.applicant_information = {};
    if (!acord125Updates.applicant_information.named_insured) acord125Updates.applicant_information.named_insured = {};
    if (!acord125Updates.applicant_information.named_insured.mailing_address) acord125Updates.applicant_information.named_insured.mailing_address = {};
    acord125Updates.applicant_information.named_insured.mailing_address.zip = updates.zipCode;
  }
  
  if (updates.industry !== undefined) {
    if (!acord125Updates.applicant_information) acord125Updates.applicant_information = {};
    if (!acord125Updates.applicant_information.named_insured) acord125Updates.applicant_information.named_insured = {};
    acord125Updates.applicant_information.named_insured.sic = updates.industry;
  }
  
  if (updates.employeeCount !== undefined) {
    if (!acord125Updates.premises_information) acord125Updates.premises_information = {};
    if (!acord125Updates.premises_information.location) acord125Updates.premises_information.location = {};
    acord125Updates.premises_information.location.full_time_employees = updates.employeeCount;
  }
  
  if (updates.annualRevenue !== undefined) {
    if (!acord125Updates.premises_information) acord125Updates.premises_information = {};
    if (!acord125Updates.premises_information.location) acord125Updates.premises_information.location = {};
    acord125Updates.premises_information.location.annual_revenues = updates.annualRevenue;
  }
  
  if (updates.contactName !== undefined) {
    if (!acord125Updates.contact_information) acord125Updates.contact_information = {};
    acord125Updates.contact_information.contact_name = updates.contactName;
  }
  
  if (updates.contactEmail !== undefined) {
    if (!acord125Updates.contact_information) acord125Updates.contact_information = {};
    acord125Updates.contact_information.primary_email = updates.contactEmail;
  }
  
  if (updates.contactPhone !== undefined) {
    if (!acord125Updates.contact_information) acord125Updates.contact_information = {};
    acord125Updates.contact_information.primary_phone = updates.contactPhone;
  }
  
  if (updates.additionalNotes !== undefined) {
    if (!acord125Updates.premises_information) acord125Updates.premises_information = {};
    if (!acord125Updates.premises_information.location) acord125Updates.premises_information.location = {};
    acord125Updates.premises_information.location.description_of_operations = updates.additionalNotes;
  }
  
  console.log('Final ACORD125 updates:', acord125Updates);
  return acord125Updates;
};

export default function CompanyPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;

  const [companyData, setCompanyData] = useState<{name: string, industry: string} | null>(null);
  const [companyMemory, setCompanyMemory] = useState<any>(null);
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [formType, setFormType] = useState<'acord125' | 'acord126'>('acord125');
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);

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
          body: JSON.stringify({ 
            companyId,
            formType 
          }),
        });
        
        const formResult = await formResponse.json();
        
        if (!formResult.success) {
          throw new Error(formResult.error || 'Failed to generate form');
        }
        
        // Set form data from response
        setFormData(formResult.data);
        setFormType(formResult.formType || 'acord125');
      } catch (err) {
        console.error('Error in form generation process:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyAndGenerateForm();
  }, [companyId, isSignedIn]);

  const generateForm = async (selectedFormType: 'acord125' | 'acord126') => {
    if (isRegenerating) return;
    
    setIsRegenerating(true);
    setError(null);
    
    try {
      // Generate form with AI
      const formResponse = await fetch('/api/form-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          companyId,
          formType: selectedFormType 
        }),
      });
      
      const formResult = await formResponse.json();
      
      if (!formResult.success) {
        throw new Error(formResult.error || 'Failed to generate form');
      }
      
      // Set form data from response
      setFormData(formResult.data);
      setFormType(selectedFormType);
    } catch (err) {
      console.error('Error in form generation process:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleFormUpdate = (updates: any) => {
    if (!formData) return;
    
    // Create a deep copy of the current form data
    const newFormData = JSON.parse(JSON.stringify(formData));
    
    // Merge the updates into the copy, handling nested structures
    const mergeUpdates = (target: any, source: any) => {
      Object.keys(source).forEach(key => {
        if (typeof source[key] === 'object' && source[key] !== null) {
          if (!target[key]) {
            target[key] = {};
          }
          mergeUpdates(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      });
    };
    
    // Log the current form data and updates for debugging
    console.log('Current form data:', formData);
    console.log('Applying updates:', updates);
    
    mergeUpdates(newFormData, updates);
    
    // Log the new form data after updates
    console.log('Updated form data:', newFormData);
    
    // Update the form state
    setFormData(newFormData);
  };

  const handleBackClick = () => {
    router.push('/companies');
  };

  const handleDownloadPdf = async () => {
    if (!formData) return;
    
    try {
      // Convert ACORD form to insurance form for PDF generation
      const insuranceForm = adaptToInsuranceForm(formData);
      
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      
      // Add a page
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
      const { width, height } = page.getSize();
      const fontSize = 12;
      const titleSize = 16;
      const headerSize = 14;
      const margin = 50;
      let y = height - margin;
      
      // Add title
      page.drawText('INSURANCE APPLICATION FORM', {
        x: margin,
        y,
        size: titleSize,
        font: timesBold,
        color: rgb(0, 0, 0),
      });
      
      y -= 30;
      
      // Company Information section
      page.drawText('COMPANY INFORMATION', {
        x: margin,
        y,
        size: headerSize,
        font: timesBold,
        color: rgb(0, 0, 0),
      });
      
      y -= 20;
      
      // Company details
      const details = [
        `Company Name: ${insuranceForm.companyName}`,
        `Address: ${insuranceForm.address}`,
        `City: ${insuranceForm.city}`,
        `State: ${insuranceForm.state}`,
        `Zip Code: ${insuranceForm.zipCode}`,
        `Industry: ${insuranceForm.industry}`,
        `Employee Count: ${insuranceForm.employeeCount}`,
        `Annual Revenue: $${insuranceForm.annualRevenue.toLocaleString()}`,
      ];
      
      for (const detail of details) {
        page.drawText(detail, {
          x: margin,
          y,
          size: fontSize,
          font: timesRoman,
          color: rgb(0, 0, 0),
        });
        y -= 20;
      }
      
      y -= 10;
      
      // Coverage Information section
      page.drawText('COVERAGE INFORMATION', {
        x: margin,
        y,
        size: headerSize,
        font: timesBold,
        color: rgb(0, 0, 0),
      });
      
      y -= 20;
      
      // Coverage details
      const coverageDetails = [
        `Effective Date: ${insuranceForm.effectiveDate}`,
        `Expiration Date: ${insuranceForm.expirationDate}`,
        `Premium Amount: $${insuranceForm.premiumAmount.toLocaleString()}`,
      ];
      
      for (const detail of coverageDetails) {
        page.drawText(detail, {
          x: margin,
          y,
          size: fontSize,
          font: timesRoman,
          color: rgb(0, 0, 0),
        });
        y -= 20;
      }
      
      y -= 10;
      
      // Contact Information section
      page.drawText('CONTACT INFORMATION', {
        x: margin,
        y,
        size: headerSize,
        font: timesBold,
        color: rgb(0, 0, 0),
      });
      
      y -= 20;
      
      // Contact details
      const contactDetails = [
        `Contact Name: ${insuranceForm.contactName}`,
        `Contact Email: ${insuranceForm.contactEmail}`,
        `Contact Phone: ${insuranceForm.contactPhone}`,
      ];
      
      for (const detail of contactDetails) {
        page.drawText(detail, {
          x: margin,
          y,
          size: fontSize,
          font: timesRoman,
          color: rgb(0, 0, 0),
        });
        y -= 20;
      }
      
      // Additional Notes section
      if (insuranceForm.additionalNotes) {
        y -= 10;
        
        page.drawText('ADDITIONAL NOTES', {
          x: margin,
          y,
          size: headerSize,
          font: timesBold,
          color: rgb(0, 0, 0),
        });
        
        y -= 20;
        
        page.drawText(insuranceForm.additionalNotes, {
          x: margin,
          y,
          size: fontSize,
          font: timesRoman,
          color: rgb(0, 0, 0),
          maxWidth: width - (margin * 2),
        });
      }
      
      // Generate binary data of PDF
      const pdfBytes = await pdfDoc.save();
      
      // Generate a filename based on company name
      const filename = `${insuranceForm.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${formType.toUpperCase()}_Form.pdf`;
      
      // Download the PDF
      downloadPdf(pdfBytes, filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
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
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  {companyData ? companyData.name : 'Loading company...'}
                </h2>
                {companyData && companyData.industry && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Industry: {companyData.industry}</p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">ID: {companyId}</p>
              </div>
              
              {formData && !loading && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Form Type:</span>
                  <Select 
                    value={formType}
                    onValueChange={(value: string) => {
                      const newFormType = value as 'acord125' | 'acord126';
                      if (newFormType !== formType) {
                        generateForm(newFormType);
                      }
                    }}
                    disabled={isRegenerating}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select form type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="acord125">ACORD 125</SelectItem>
                      <SelectItem value="acord126">ACORD 126</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="outline"
                    className="flex items-center gap-1 ml-2"
                    onClick={handleDownloadPdf}
                  >
                    <Download className="h-4 w-4" />
                    <span>Download PDF</span>
                  </Button>
                  
                  {isRegenerating && (
                    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-blue-600 dark:border-blue-400 border-r-transparent align-[-0.125em]"></div>
                  )}
                </div>
              )}
            </div>
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
                  {formType === 'acord125' ? (
                    <ACORD125FormComponent 
                      formData={formData} 
                      onEditForm={handleFormUpdate} 
                    />
                  ) : (
                    <ACORD126FormComponent 
                      formData={formData} 
                      onEditForm={handleFormUpdate} 
                    />
                  )}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <ConversationInterface 
                  formData={adaptToInsuranceForm(formData)} 
                  onUpdateForm={(updates: Partial<InsuranceForm> & Record<string, any>) => {
                    console.log('Raw updates from AI:', updates);
                    
                    // Special handling for direct agency and contact updates
                    if (formType === 'acord125') {
                      // Create a copy of the updates for modification
                      const processedUpdates = { ...updates };
                      
                      // Handle special cases for fields that are commonly mismatched
                      // Map known AI response keys to the correct form fields
                      
                      // Handle agency_information mapping issue
                      if ('agency_information' in updates) {
                        console.log('Processing agency_information updates');
                        // Move to the correct location in the form structure
                        processedUpdates.agency = updates.agency_information;
                        delete processedUpdates.agency_information;
                      }
                      
                      // Handle carrier_information mapping issue
                      if ('carrier_information' in updates) {
                        console.log('Processing carrier_information updates');
                        // Move to the correct location in the form structure
                        processedUpdates.carrier = updates.carrier_information;
                        delete processedUpdates.carrier_information;
                      }
                      
                      // Handle applicant_info mapping issue (if it happens)
                      if ('applicant_info' in updates) {
                        console.log('Processing applicant_info updates');
                        processedUpdates.applicant_information = updates.applicant_info;
                        delete processedUpdates.applicant_info;
                      }
                      
                      // Handle contact_info mapping issue (if it happens)
                      if ('contact_info' in updates) {
                        console.log('Processing contact_info updates');
                        processedUpdates.contact_information = updates.contact_info;
                        delete processedUpdates.contact_info;
                      }
                      
                      // Handle prior_carrier_info mapping issue (if it happens)
                      if ('prior_carrier_info' in updates) {
                        console.log('Processing prior_carrier_info updates');
                        processedUpdates.prior_carrier_information = updates.prior_carrier_info;
                        delete processedUpdates.prior_carrier_info;
                      }
                      
                      // Direct field mappings that should pass through
                      ['contact_information', 'applicant_information', 'premises_information', 
                       'nature_of_business', 'prior_carrier_information', 'general_information',
                       'loss_history'].forEach(key => {
                        if (key in updates) {
                          console.log(`Processing ${key} updates directly`);
                          processedUpdates[key] = updates[key];
                        }
                      });
                      
                      console.log('Processed updates:', processedUpdates);
                      handleFormUpdate(processedUpdates);
                    } else if (formType === 'acord126') {
                      // Create a copy of the updates for modification
                      const processedUpdates = { ...updates };
                      
                      // Apply similar mapping fixes for ACORD126
                      if ('agency_information' in updates) {
                        processedUpdates.agency = updates.agency_information;
                        delete processedUpdates.agency_information;
                      }
                      
                      if ('carrier_information' in updates) {
                        processedUpdates.carrier = updates.carrier_information;
                        delete processedUpdates.carrier_information;
                      }
                      
                      if ('contact_info' in updates) {
                        processedUpdates.contact_information = updates.contact_info;
                        delete processedUpdates.contact_info;
                      }
                      
                      console.log('Processed ACORD126 updates:', processedUpdates);
                      handleFormUpdate(processedUpdates);
                    }
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