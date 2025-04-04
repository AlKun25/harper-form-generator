import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { InsuranceForm } from '@/types';
import { Mic, MicOff, Volume2, VolumeX, Send, AlertCircle, Loader2 } from 'lucide-react';
import useVoiceRecording from '@/hooks/useVoiceRecording';
import useTextToSpeech from '@/hooks/useTextToSpeech';
import aiProvider, { AIProviderType } from '@/lib/ai-services/ai-provider';

interface ConversationInterfaceProps {
  formData: InsuranceForm;
  onUpdateForm: (updates: Partial<InsuranceForm>) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ConversationInterface({ formData, onUpdateForm }: ConversationInterfaceProps) {
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I can help you edit this insurance form. What would you like to change?'
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isBrowserSupported, setIsBrowserSupported] = useState(false);
  const [aiProviderStatus, setAiProviderStatus] = useState<{
    provider: AIProviderType;
    hasVoiceFeatures: boolean;
  }>({
    provider: AIProviderType.NONE,
    hasVoiceFeatures: false
  });

  // Get the AI provider status on mount
  useEffect(() => {
    setAiProviderStatus({
      provider: aiProvider.getCurrentProvider(),
      hasVoiceFeatures: aiProvider.hasVoiceFeatures()
    });
  }, []);

  // Initialize voice recording hook
  const { 
    isRecording, 
    isProcessing: isTranscribing, 
    error: recordingError, 
    startRecording, 
    stopRecording 
  } = useVoiceRecording({
    onTranscriptionComplete: (text) => {
      setUserInput(text);
    },
    onAutoSubmit: (text) => {
      processUserMessage(text);
    }
  });

  // Initialize text-to-speech hook
  const {
    isPlaying,
    isLoading: isSpeaking,
    error: ttsError,
    speakText,
    stopSpeech
  } = useTextToSpeech();

  // Check browser support for voice features
  useEffect(() => {
    setIsBrowserSupported(
      typeof window !== 'undefined' && 
      'mediaDevices' in navigator && 
      'getUserMedia' in navigator.mediaDevices
    );
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const processUserMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isProcessing) return;
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    setIsProcessing(true);
    
    try {
      // Check if we have an AI provider available
      if (aiProviderStatus.provider === AIProviderType.NONE) {
        // If no AI provider is available, just acknowledge the message
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'I apologize, but the AI assistant is currently unavailable. Please edit the form directly.' 
        }]);
        setIsProcessing(false);
        setTimeout(scrollToBottom, 100);
        setUserInput('');
        return;
      }
      
      // Store the current provider before making the API call
      const currentProvider = aiProvider.getCurrentProvider();
      
      // Prepare the system message with current form data
      const systemMessage = `
You are an assistant helping a user modify an insurance form. You have access to the following form sections and fields:

ACORD 125 Form Fields:
---------------------
Header Information:
- Agency Name (agency.name)
- Agency Contact (agency.contact_name)
- Carrier Name (carrier.name)
- Policy Number (carrier.policy_number)
- Transaction Type (status_of_transaction.transaction_type)
- Date (date)

Applicant Information:
- Named Insured (applicant_information.named_insured.name)
- Entity Type (applicant_information.named_insured.entity_type)
- Mailing Address:
  * Street Address (applicant_information.named_insured.mailing_address.street_address)
  * City (applicant_information.named_insured.mailing_address.city)
  * State (applicant_information.named_insured.mailing_address.state)
  * ZIP Code (applicant_information.named_insured.mailing_address.zip)
- Business Phone (applicant_information.named_insured.business_phone)
- Website (applicant_information.named_insured.website_address)
- FEIN/SSN (applicant_information.named_insured.fein_or_soc_sec)
- NAICS Code (applicant_information.named_insured.naics)
- SIC Code (applicant_information.named_insured.sic)

Contact Information:
- Contact Name (contact_information.contact_name)
- Phone Number (contact_information.primary_phone)
- Email (contact_information.primary_email)

Nature of Business:
- Business Type (nature_of_business.business_type)
- Date Business Started (nature_of_business.date_business_started)
- Description of Operations (nature_of_business.description_primary_operations)

Premises Information:
- Street (premises_information.location.street)
- City (premises_information.location.city)
- State (premises_information.location.state)
- ZIP (premises_information.location.zip)
- Full Time Employees (premises_information.location.full_time_employees)
- Part Time Employees (premises_information.location.part_time_employees)
- Annual Revenues (premises_information.location.annual_revenues)
- Description of Operations (premises_information.location.description_of_operations)

Prior Carrier Information:
- Carrier Name (prior_carrier_information.carrier_name)
- Policy Number (prior_carrier_information.policy_number)
- Effective Date (prior_carrier_information.effective_date)
- Expiration Date (prior_carrier_information.expiration_date)
- Premium (prior_carrier_information.premium)

General Information:
- Has Subsidiaries (general_information.has_subsidiaries)
- Safety Program:
  * Has Program (general_information.safety_program.has_program)
  * Safety Manual (general_information.safety_program.safety_manual)
  * Monthly Meetings (general_information.safety_program.monthly_meetings)
- Exposures:
  * Has Exposure to Hazards (general_information.exposures.has_exposure_to_hazards)
  * Details (general_information.exposures.details)
- Prior Cancellations:
  * Has Prior Cancellations (general_information.prior_cancellations.has_prior_cancellations)
  * Reason (general_information.prior_cancellations.reason)
- Bankruptcy:
  * Has Bankruptcy (general_information.bankruptcy.has_bankruptcy)
  * Details (general_information.bankruptcy.details)

Loss History:
- Has Losses (loss_history.has_losses)
- Claims (Array):
  * Date of Occurrence (loss_history.claims[].date_of_occurrence)
  * Description (loss_history.claims[].description)
  * Amount Paid (loss_history.claims[].amount_paid)
  * Amount Reserved (loss_history.claims[].amount_reserved)
  * Status (loss_history.claims[].status)
- Total Losses (loss_history.total_losses)

ACORD 126 Form Fields:
---------------------
Header Information:
- Date (date)
- Agency Name (agency.name)
- Agency Contact (agency.contact_name)
- Carrier Name (carrier.name)
- Policy Number (carrier.policy_number)
- Transaction Type (status_of_transaction.transaction_type)

Applicant Information:
- Named Insured (applicant_information.named_insured.name)
- Mailing Address:
  * Street Address (applicant_information.named_insured.mailing_address.street_address)
  * City (applicant_information.named_insured.mailing_address.city)
  * State (applicant_information.named_insured.mailing_address.state)
  * ZIP Code (applicant_information.named_insured.mailing_address.zip)
- Business Phone (applicant_information.named_insured.business_phone)
- Website (applicant_information.named_insured.website_address)

Contact Information:
- Contact Name (contact_information.contact_name)
- Phone Number (contact_information.primary_phone)
- Email (contact_information.primary_email)

Policy Information:
- Proposed Effective Date (policy_information.proposed_eff_date)
- Proposed Expiration Date (policy_information.proposed_exp_date)
- Limits of Liability:
  * Each Occurrence (policy_information.limits_of_liability.each_occurrence)
  * Damage to Rented Premises (policy_information.limits_of_liability.damage_to_rented_premises)
  * Medical Expense (policy_information.limits_of_liability.medical_expense)
  * Personal & Advertising Injury (policy_information.limits_of_liability.personal_and_advertising_injury)
  * General Aggregate (policy_information.limits_of_liability.general_aggregate)
  * Products-Completed Operations Aggregate (policy_information.limits_of_liability.products_completed_operations_aggregate)
- Deductible:
  * Type (policy_information.deductible.type)
  * Amount (policy_information.deductible.amount)

Location Information (Array):
- Location Number (locations[0].location_number)
- Street Address (locations[0].street_address)
- City (locations[0].city)
- State (locations[0].state)
- ZIP Code (locations[0].zip)
- Interest (locations[0].interest)
- Additional Interests:
  * Name (locations[0].additional_interests[0].name)
  * Interest Type (locations[0].additional_interests[0].interest_type)
  * Certificate Required (locations[0].additional_interests[0].certificate_required)

Classifications (Array):
- Location Number (classifications[0].location_number)
- Classification Description (classifications[0].classification_description)
- Class Code (classifications[0].class_code)
- Premium Basis (classifications[0].premium_basis)
- Exposure (classifications[0].exposure)
- Territory (classifications[0].territory)
- Rate (classifications[0].rate)
- Premium (classifications[0].premium)

Coverage Information:
- Occurrence/Claims Made (coverage_information.occurrence_claims_made)
- Claims Made Retroactive Date (coverage_information.claims_made_retroactive_date)
- Employee Benefits Liability (coverage_information.employee_benefits_liability)
- Number of Employees (coverage_information.number_of_employees)
- Deductible (coverage_information.deductible)
- Retroactive Date (coverage_information.retroactive_date)
- Other Coverages:
  * Coverage Type (coverage_information.other_coverages[0].coverage_type)
  * Description (coverage_information.other_coverages[0].description)

Contractor Information:
- Does Applicant Subcontract Work (contractor_information.does_applicant_subcontract_work)
- Percentage Subcontracted (contractor_information.percentage_subcontracted)
- Types of Work Subcontracted (contractor_information.types_of_work_subcontracted)
- Annual Cost of Subcontractors (contractor_information.annual_cost_of_subcontractors)
- Are Certificates of Insurance Required (contractor_information.are_certificates_of_insurance_required)
- Minimum Limit Requirements (contractor_information.minimum_limit_requirements)
- Is Applicant Added as Additional Insured (contractor_information.is_applicant_added_as_additional_insured)

Additional Questions:
- Has Discontinued Products (additional_questions.has_discontinued_products)
- Details Discontinued Products (additional_questions.details_discontinued_products)
- Has Foreign Operations (additional_questions.has_foreign_operations)
- Details Foreign Operations (additional_questions.details_foreign_operations)
- Has Hold Harmless Agreements (additional_questions.has_hold_harmless_agreements)
- Details Hold Harmless Agreements (additional_questions.details_hold_harmless_agreements)
- Has Demolition Exposure (additional_questions.has_demolition_exposure)
- Details Demolition Exposure (additional_questions.details_demolition_exposure)
- Has Independent Contractors (additional_questions.has_independent_contractors)
- Details Independent Contractors (additional_questions.details_independent_contractors)

Loss History:
- Has Losses (loss_history.has_losses)
- Claims (Array):
  * Date of Occurrence (loss_history.claims[0].date_of_occurrence)
  * Description (loss_history.claims[0].description)
  * Amount Paid (loss_history.claims[0].amount_paid)
  * Amount Reserved (loss_history.claims[0].amount_reserved)
  * Status (loss_history.claims[0].status)
- Total Losses (loss_history.total_losses)

Remarks:
- Additional Remarks (remarks)

Current form data:
${JSON.stringify(formData, null, 2)}

When the user asks you to make changes to the form:
1. First identify which specific field they want to update using the exact paths shown above
2. Return a JSON object with ONLY the fields that need to be updated
3. Use the exact field paths when constructing the update object

Examples:
- If they say "Change the deductible to $5,000", respond with:
{"policy_information": {"deductible": {"amount": 5000}}}

- If they say "Update the contact email to john@example.com", respond with:
{"contact_information": {"primary_email": "john@example.com"}}

- If they say "Change the agency contact to John Smith", respond with:
{"agency": {"contact_name": "John Smith"}}

- If they say "Update the policy number to ABC123456", respond with:
{"carrier": {"policy_number": "ABC123456"}}

- If they say "Set the annual revenue to $750,000", respond with:
{"premises_information": {"location": {"annual_revenues": 750000}}}

- If they say "Update the prior carrier name to Travelers", respond with:
{"prior_carrier_information": {"carrier_name": "Travelers"}}

- If they say "Change the business description to consulting services", respond with:
{"nature_of_business": {"description_primary_operations": "consulting services"}}

For currency values, extract only the numeric value (no commas, dollar signs).
For dates, use the format YYYY-MM-DD.
If you can't determine exactly which field to update, ask for clarification about which specific field they want to modify.
Only respond with the JSON object if a change is requested, otherwise respond conversationally.
`;

      // Call the AI provider
      const response = await aiProvider.chatCompletion({
        messages: [
          { role: 'system', content: systemMessage },
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
      });

      // Check if the provider has changed due to fallback (don't show any message to user)
      const newProvider = aiProvider.getCurrentProvider();
      if (currentProvider !== newProvider) {
        // Silently update the local state to reflect the new provider
        setAiProviderStatus({
          provider: newProvider,
          hasVoiceFeatures: aiProvider.hasVoiceFeatures()
        });
      }

      const assistantResponse = response.text || 'Sorry, I could not process your request.';
      
      // Check if response contains a JSON object for form updates
      let jsonMatch = assistantResponse.match(/```json\s*({[\s\S]*?})\s*```/);
      if (!jsonMatch) {
        // If not found, try to find any JSON object with braces in the text
        jsonMatch = assistantResponse.match(/({(?:[^{}]|{[^{}]*})*})/g);
      }
      
      let updates = null;
      let displayMessage = assistantResponse;
      
      if (jsonMatch) {
        // Try to parse the first matching JSON object
        const jsonStr = jsonMatch[0].replace(/```json|```/g, '').trim();
        console.log('Extracted JSON from response:', jsonStr);
        
        try {
          updates = JSON.parse(jsonStr);
          console.log('Parsed updates:', updates);
          
          // Remove the JSON from the display message to avoid showing technical content
          displayMessage = displayMessage.replace(jsonMatch[0], '').trim();
          
          // If the message is now empty or just contains code fences, replace with a generic message
          if (!displayMessage || displayMessage.match(/^```\s*```$/)) {
            displayMessage = 'I understand your request.';
          }
        } catch (parseError) {
          console.error('Error parsing JSON:', parseError);
          // Try cleaning up the string more aggressively
          const cleanedStr = jsonStr.replace(/[\u201C\u201D]/g, '"').replace(/'/g, '"');
          try {
            updates = JSON.parse(cleanedStr);
            console.log('Parsed updates after cleanup:', updates);
            
            // Remove the JSON from the display message
            displayMessage = displayMessage.replace(jsonMatch[0], '').trim();
            
            // If the message is now empty or just contains code fences, replace with a generic message
            if (!displayMessage || displayMessage.match(/^```\s*```$/)) {
              displayMessage = 'I understand your request.';
            }
          } catch (e) {
            console.error('Failed to parse JSON even after cleanup:', e);
          }
        }
      } else if (assistantResponse.toLowerCase().includes('update') && 
               (assistantResponse.toLowerCase().includes('contact') || 
                assistantResponse.toLowerCase().includes('agency') ||
                assistantResponse.toLowerCase().includes('phone') ||
                assistantResponse.toLowerCase().includes('email'))) {
        // If we can't find JSON but the message clearly indicates an update intention,
        // try to extract the update information heuristically
        console.log('No JSON found, but update intent detected. Trying to extract update information.');
        
        // Example: Find patterns like "I've updated the contact phone to 123-456-7890"
        const phoneMatch = assistantResponse.match(/phone\s+(?:number|to)\s+([0-9\-() +]+)/i);
        const emailMatch = assistantResponse.match(/email\s+(?:to|address)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
        const nameMatch = assistantResponse.match(/(?:contact|name)\s+(?:to|as)\s+([A-Za-z ]+)/i);
        
        if (phoneMatch && phoneMatch[1]) {
          updates = { contact_information: { primary_phone: phoneMatch[1].trim() } };
          console.log('Extracted phone update:', updates);
        } else if (emailMatch && emailMatch[1]) {
          updates = { contact_information: { primary_email: emailMatch[1].trim() } };
          console.log('Extracted email update:', updates);
        } else if (nameMatch && nameMatch[1]) {
          updates = { contact_information: { contact_name: nameMatch[1].trim() } };
          console.log('Extracted name update:', updates);
        }
      } else {
        console.log('No JSON object or clear update intent found in response:', assistantResponse);
      }
      
      // Add assistant response to chat (filtered to remove JSON)
      setMessages(prev => [...prev, { role: 'assistant', content: displayMessage }]);
      
      if (updates) {
        // Extract field name and value in a more programmatic way
        let fieldName = '';
        let fieldValue = '';
        
        // Function to convert path to human-readable field name
        const getHumanReadableFieldName = (path: string): string => {
          // Extract the last part of the path for simple fields
          const parts = path.split('.');
          const lastPart = parts[parts.length - 1];
          
          // Convert snake_case to space-separated words
          let readableName = lastPart.replace(/_/g, ' ');
          
          // Special case mapping for improved readability
          const fieldNameMapping: Record<string, string> = {
            'name': 'name',
            'policy_number': 'policy number',
            'contact_name': 'contact name',
            'primary_phone': 'phone number',
            'primary_email': 'email address',
            'annual_revenues': 'annual revenue',
            'description_primary_operations': 'business description',
            'business_phone': 'business phone',
            'website_address': 'website',
            'each_occurrence': 'occurrence limit',
            'general_aggregate': 'general aggregate limit',
            'deductible': 'deductible'
          };
          
          // Check if we have a specific mapping for this field
          if (fieldNameMapping[lastPart]) {
            readableName = fieldNameMapping[lastPart];
          }
          
          // For more context in nested fields, include parent path in certain cases
          if (parts.length > 1) {
            // Map parent paths to context prefixes
            const parentContextMapping: Record<string, string> = {
              'carrier': 'carrier',
              'agency': 'agency',
              'contact_information': 'contact',
              'applicant_information': 'applicant',
              'premises_information': 'premises',
              'prior_carrier_information': 'prior carrier',
              'nature_of_business': 'business',
              'policy_information': 'policy',
              'limits_of_liability': 'liability'
            };
            
            // Add prefix if needed and not redundant with field name
            const parentKey = parts[parts.length - 2];
            if (parentContextMapping[parentKey] && 
                !readableName.includes(parentContextMapping[parentKey])) {
              readableName = `${parentContextMapping[parentKey]} ${readableName}`;
            }
          }
          
          return readableName;
        };
        
        // Function to recursively find and format the first field in the updates object
        const findFirstField = (obj: Record<string, any>, currentPath = ''): [string, string] | null => {
          for (const [key, value] of Object.entries(obj)) {
            const newPath = currentPath ? `${currentPath}.${key}` : key;
            
            if (value !== null && typeof value === 'object') {
              // Recursively search in nested objects
              const result = findFirstField(value, newPath);
              if (result) return result;
            } else {
              // Format the value based on type
              let formattedValue = String(value);
              
              // Add dollar sign to values that look like monetary amounts
              if (/^\d+(\.\d+)?$/.test(formattedValue) && 
                  (newPath.includes('revenue') || 
                   newPath.includes('premium') || 
                   newPath.includes('limit') || 
                   newPath.includes('deductible') ||
                   newPath.includes('amount') ||
                   newPath.includes('cost'))) {
                formattedValue = `$${formattedValue}`;
              }
              
              return [getHumanReadableFieldName(newPath), formattedValue];
            }
          }
          return null;
        };
        
        // Extract field info
        const fieldInfo = findFirstField(updates);
        if (fieldInfo) {
          [fieldName, fieldValue] = fieldInfo;
        } else {
          // Fallback if no field found (unlikely)
          fieldName = 'field';
          fieldValue = 'updated value';
        }
        
        // Create a more personalized insurance broker-like message with call to action
        const brokerMessages = [
          `Perfect! I've updated the ${fieldName} to ${fieldValue}. What else would you like to adjust on this form?`,
          `I've set the ${fieldName} to ${fieldValue}. Is there anything else you'd like me to update?`,
          `Great, the ${fieldName} has been changed to ${fieldValue}. Would you like to review any other details?`,
          `The ${fieldName} is now ${fieldValue}. What other changes would you like to make?`,
          `I've updated your policy's ${fieldName} to ${fieldValue}. Can I help you with any other fields?`
        ];
        
        // Choose a random broker message for variety
        const brokerMessage = brokerMessages[Math.floor(Math.random() * brokerMessages.length)];
        
        try {
          // Force the form into editing mode before applying updates
          // Using a proper DOM selector with buttons that contain "Edit Form" text
          const editButtons = Array.from(document.querySelectorAll('button'))
            .filter(button => button.textContent?.includes('Edit Form'));
          
          if (editButtons.length > 0) {
            console.log('Found Edit Form button, clicking to enable editing');
            editButtons[0].click();
            
            // Force the form into edit mode
            console.log('Forcing both forms into edit mode directly');
            const forms = document.querySelectorAll('form');
            forms.forEach(form => {
              form.classList.add('editing');
            });
            
            // Give the UI a moment to enter edit mode before applying updates
            setTimeout(() => {
              // Apply the updates
              console.log('Applying updates to form data:', updates);
              onUpdateForm(updates!);
              
              // Try to directly update form fields as well for better reliability
              console.log('Directly updating form fields');
              tryDirectFormFieldUpdate(updates!);
              
              // Add more direct form manipulation to ensure updates are visible
              console.log('Performing additional direct updates');
              Object.entries(updates!).forEach(([key, value]) => {
                if (key === 'contact_information' && typeof value === 'object' && value !== null) {
                  // Handle contact information updates
                  const contactInfo = value as Record<string, any>;
                  
                  if (contactInfo.primary_phone) {
                    const phoneInput = document.querySelector('input[id*="phone"]') as HTMLInputElement;
                    if (phoneInput) {
                      console.log('Directly setting phone input value:', contactInfo.primary_phone);
                      phoneInput.value = String(contactInfo.primary_phone);
                      phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
                      phoneInput.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                  }
                  
                  if (contactInfo.contact_name) {
                    const nameInput = document.querySelector('input[id*="contact-name"]') as HTMLInputElement;
                    if (nameInput) {
                      console.log('Directly setting contact name input value:', contactInfo.contact_name);
                      nameInput.value = String(contactInfo.contact_name);
                      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
                      nameInput.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                  }
                  
                  if (contactInfo.primary_email) {
                    const emailInput = document.querySelector('input[id*="email"]') as HTMLInputElement;
                    if (emailInput) {
                      console.log('Directly setting email input value:', contactInfo.primary_email);
                      emailInput.value = String(contactInfo.primary_email);
                      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
                      emailInput.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                  }
                } else if (key === 'agency' && typeof value === 'object' && value !== null) {
                  // Handle agency information updates
                  const agencyInfo = value as Record<string, any>;
                  
                  if (agencyInfo.contact_name) {
                    const contactInput = document.querySelector('input[id*="agency-contact"]') as HTMLInputElement;
                    if (contactInput) {
                      console.log('Directly setting agency contact value:', agencyInfo.contact_name);
                      contactInput.value = String(agencyInfo.contact_name);
                      contactInput.dispatchEvent(new Event('input', { bubbles: true }));
                      contactInput.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                  }
                }
              });
              
              // After a short delay, find and click the Save button to exit edit mode
              setTimeout(() => {
                const saveButtons = Array.from(document.querySelectorAll('button'))
                  .filter(button => button.textContent?.includes('Save Changes'));
                
                if (saveButtons.length > 0) {
                  console.log('Automatically saving changes');
                  saveButtons[0].click();
                  
                  // Only show the broker-style message after all operations are complete
                  setMessages(prev => {
                    // Remove any pending "I am updating..." or JSON messages
                    const filteredMessages = prev.filter(m => 
                      !m.content.includes("updating the form") && 
                      !m.content.startsWith("{") &&
                      !m.content.includes("I have updated the form") &&
                      !m.content.includes("The changes are in edit mode now")
                    );
                    
                    return [...filteredMessages, { 
                      role: 'assistant', 
                      content: brokerMessage 
                    }];
                  });
                } else {
                  // If we can't find the save button, still show the broker message but without the "edit mode" text
                  setMessages(prev => {
                    // Remove any pending "I am updating..." or JSON messages
                    const filteredMessages = prev.filter(m => 
                      !m.content.includes("updating the form") && 
                      !m.content.startsWith("{") &&
                      !m.content.includes("I have updated the form") &&
                      !m.content.includes("The changes are in edit mode now")
                    );
                    
                    return [...filteredMessages, { 
                      role: 'assistant', 
                      content: brokerMessage 
                    }];
                  });
                }
              }, 1000); // Increase delay to ensure updates are applied
            }, 500); // Increase delay to ensure edit mode is entered
          } else {
            // If we can't find the edit button, still apply updates
            // and try direct form field update as a fallback
            console.log('No Edit Form button found, applying updates directly');
            onUpdateForm(updates);
            tryDirectFormFieldUpdate(updates);
            
            // Show the broker-style message
            setMessages(prev => {
              // Remove any pending "I am updating..." or JSON messages
              const filteredMessages = prev.filter(m => 
                !m.content.includes("updating the form") && 
                !m.content.startsWith("{") &&
                !m.content.includes("I have updated the form") &&
                !m.content.includes("The changes are in edit mode now")
              );
              
              return [...filteredMessages, { 
                role: 'assistant', 
                content: brokerMessage 
              }];
            });
          }
        } catch (error) {
          console.error('Error applying form updates:', error);
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: `I'm sorry, I encountered an issue while updating the ${fieldName}. Could you try again or let me know what other changes you need?` 
          }]);
        }
      } else {
        console.log('No updates to apply');
      }

      // Automatically speak the assistant's response if voice features are available
      if (assistantResponse && aiProviderStatus.hasVoiceFeatures) {
        speakText(assistantResponse);
      }
    } catch (error) {
      console.error('Error processing conversation:', error);
      
      // Generic error message that doesn't mention quota limits
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your request. Please try again.' 
      }]);
      
      // Silently update provider if it has changed
      const currentProvider = aiProvider.getCurrentProvider();
      if (currentProvider !== aiProviderStatus.provider) {
        setAiProviderStatus({
          provider: currentProvider,
          hasVoiceFeatures: aiProvider.hasVoiceFeatures()
        });
      }
    } finally {
      setIsProcessing(false);
      setTimeout(scrollToBottom, 100);
      setUserInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await processUserMessage(userInput);
  };

  const handleVoiceToggle = () => {
    if (!aiProviderStatus.hasVoiceFeatures) {
      return;
    }
    
    if (isRecording) {
      // When stopping, set autoSubmit to true to automatically send the message
      stopRecording(true);
    } else {
      startRecording();
    }
  };

  const handleSpeechToggle = () => {
    if (!aiProviderStatus.hasVoiceFeatures) {
      return;
    }
    
    if (isPlaying) {
      stopSpeech();
    } else {
      // Speak the last assistant message if there is one
      const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
      if (lastAssistantMessage) {
        speakText(lastAssistantMessage.content);
      }
    }
  };
  
  // Determine if voice features should be shown
  const showVoiceFeatures = isBrowserSupported && aiProviderStatus.hasVoiceFeatures;

  // Add this helper function at the end of the component, before the return statement
  const tryDirectFormFieldUpdate = (updates: Record<string, any>, prefix = '') => {
    console.log('Attempting direct field updates', { updates, prefix });
    
    // Map field paths from the conversation format to the actual field paths in the form
    const fieldPathMap: Record<string, string> = {
      // ACORD125 fields
      // Header Information
      'date': 'date',
      'agency.name': 'agency-name',
      'agency.contact_name': 'agency-contact',
      'carrier.name': 'carrier-name',
      'carrier.policy_number': 'carrier-policy-number',
      'status_of_transaction.transaction_type': 'transaction-type',
      
      // Applicant Information
      'applicant_information.named_insured.name': 'named-insured-name',
      'applicant_information.named_insured.entity_type': 'entity-type',
      'applicant_information.named_insured.mailing_address.street_address': 'street-address',
      'applicant_information.named_insured.mailing_address.city': 'city',
      'applicant_information.named_insured.mailing_address.state': 'state',
      'applicant_information.named_insured.mailing_address.zip': 'zip-code',
      'applicant_information.named_insured.business_phone': 'business-phone',
      'applicant_information.named_insured.website_address': 'website',
      'applicant_information.named_insured.fein_or_soc_sec': 'fein-ssn',
      'applicant_information.named_insured.naics': 'naics-code',
      'applicant_information.named_insured.sic': 'sic-code',
      
      // Contact Information
      'contact_information.contact_name': 'contact_information-contact-name',
      'contact_information.primary_phone': 'contact_information-phone-number',
      'contact_information.primary_email': 'contact_information-email',
      
      // Nature of Business
      'nature_of_business.business_type': 'business-type',
      'nature_of_business.date_business_started': 'date-business-started',
      'nature_of_business.description_primary_operations': 'business-description',
      
      // Premises Information
      'premises_information.location.street': 'premises-street',
      'premises_information.location.city': 'premises-city',
      'premises_information.location.state': 'premises-state',
      'premises_information.location.zip': 'premises-zip',
      'premises_information.location.full_time_employees': 'full-time-employees',
      'premises_information.location.part_time_employees': 'part-time-employees',
      'premises_information.location.annual_revenues': 'annual-revenues',
      'premises_information.location.description_of_operations': 'premises-description',
      
      // Prior Carrier Information
      'prior_carrier_information.carrier_name': 'prior-carrier-name',
      'prior_carrier_information.policy_number': 'prior-policy-number',
      'prior_carrier_information.effective_date': 'prior-effective-date',
      'prior_carrier_information.expiration_date': 'prior-expiration-date',
      'prior_carrier_information.premium': 'prior-premium',
      
      // ACORD126 fields
      // Policy Information
      'policy_information.proposed_eff_date': 'proposed-eff-date',
      'policy_information.proposed_exp_date': 'proposed-exp-date',
      'policy_information.limits_of_liability.each_occurrence': 'each-occurrence',
      'policy_information.limits_of_liability.damage_to_rented_premises': 'damage-to-rented-premises',
      'policy_information.limits_of_liability.medical_expense': 'medical-expense',
      'policy_information.limits_of_liability.personal_and_advertising_injury': 'personal-and-advertising-injury',
      'policy_information.limits_of_liability.general_aggregate': 'general-aggregate',
      'policy_information.limits_of_liability.products_completed_operations_aggregate': 'products-completed-operations-aggregate',
      'policy_information.deductible.type': 'deductible-type',
      'policy_information.deductible.amount': 'deductible-amount',
      
      // Location Information
      'locations[0].location_number': 'location-number',
      'locations[0].street_address': 'location-street-address',
      'locations[0].city': 'location-city',
      'locations[0].state': 'location-state',
      'locations[0].zip': 'location-zip',
      'locations[0].interest': 'location-interest',
      
      // Coverage Information
      'coverage_information.occurrence_claims_made': 'occurrence-claims-made',
      'coverage_information.claims_made_retroactive_date': 'claims-made-retroactive-date',
      'coverage_information.employee_benefits_liability': 'employee-benefits-liability',
      'coverage_information.number_of_employees': 'number-of-employees',
      'coverage_information.deductible': 'coverage-deductible',
      'coverage_information.retroactive_date': 'retroactive-date',
      
      // Contractor Information
      'contractor_information.does_applicant_subcontract_work': 'does-applicant-subcontract-work',
      'contractor_information.percentage_subcontracted': 'percentage-subcontracted',
      'contractor_information.types_of_work_subcontracted': 'types-of-work-subcontracted',
      'contractor_information.annual_cost_of_subcontractors': 'annual-cost-of-subcontractors',
      'contractor_information.are_certificates_of_insurance_required': 'are-certificates-of-insurance-required',
      'contractor_information.minimum_limit_requirements': 'minimum-limit-requirements',
      'contractor_information.is_applicant_added_as_additional_insured': 'is-applicant-added-as-additional-insured',
      
      // Remarks
      'remarks': 'remarks'
    };
    
    // Recursively try to find and update form fields based on their data-field-path attributes
    Object.entries(updates).forEach(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      
      if (value !== null && typeof value === 'object') {
        // If value is an object, recurse deeper
        tryDirectFormFieldUpdate(value, path);
      } else {
        // Check if we have a special mapping for this path
        const mappedFieldId = fieldPathMap[path];
        let element: HTMLInputElement | HTMLTextAreaElement | null = null;
        
        if (mappedFieldId) {
          // Use the mapped field ID directly
          element = document.getElementById(mappedFieldId) as HTMLInputElement | HTMLTextAreaElement;
          if (element) {
            console.log(`Found element using special mapping: ${mappedFieldId} for path ${path}`);
          }
        }
        
        // If no special mapping or mapping didn't find an element, try standard approaches
        if (!element) {
          // First try by data-field-path attribute
          element = document.querySelector(`[data-field-path="${path}"]`) as HTMLInputElement | HTMLTextAreaElement;
          
          // If not found, try looking for an ID based on the last part of the path
          if (!element) {
            const pathParts = path.split('.');
            const fieldName = pathParts[pathParts.length - 1].toLowerCase().replace(/_/g, '-');
            
            // Try different ID patterns
            const possibleIds = [
              fieldName,                                      // simple field name
              `${pathParts[0]}-${fieldName}`,                 // section-fieldname
              `${pathParts[0]}-${pathParts[1]}-${fieldName}`, // section-subsection-fieldname
              `contact_information-${fieldName}`,             // special case for contact fields
              `agency-${fieldName}`,                          // special case for agency fields
              `primary-${fieldName}`                          // special case for primary-phone, primary-email
            ];
            
            // Try to find by ID first (most reliable)
            for (const id of possibleIds) {
              const foundElement = document.getElementById(id);
              if (foundElement) {
                element = foundElement as HTMLInputElement | HTMLTextAreaElement;
                console.log(`Found element by ID: ${id}`);
                break;
              }
            }
            
            // If still not found, try using label text
            if (!element) {
              // Try to find fields by their label text
              const labelElements = Array.from(document.querySelectorAll('label'));
              for (const labelElement of labelElements) {
                // Check if the label text contains our field name
                const labelText = labelElement.textContent?.toLowerCase() || '';
                const matchesField = 
                  labelText.includes(fieldName) || 
                  (fieldName === 'primary-phone' && labelText.includes('phone')) ||
                  (fieldName === 'contact-name' && labelText.includes('contact'));
                
                if (matchesField && labelElement.htmlFor) {
                  // Found a matching label with a for attribute
                  const foundElement = document.getElementById(labelElement.htmlFor);
                  if (foundElement) {
                    element = foundElement as HTMLInputElement | HTMLTextAreaElement;
                    console.log(`Found element by label text: "${labelText}" with ID ${labelElement.htmlFor}`);
                    break;
                  }
                }
              }
            }
          }
        }
        
        if (element) {
          console.log(`Found element for ${path}, updating value to ${value}`);
          
          // Update value based on input type
          if (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'checkbox') {
            const checkbox = element as HTMLInputElement;
            checkbox.checked = !!value;
            
            // Dispatch change event to trigger any listeners
            const event = new Event('change', { bubbles: true });
            checkbox.dispatchEvent(event);
          } else {
            element.value = value.toString();
            
            // Dispatch input and change events to trigger any listeners
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
          }
        } else {
          console.log(`Could not find input element for path: ${path}`);
        }
      }
    });
  };

  return (
    <div className="flex flex-col h-[500px] border rounded-lg shadow-sm bg-white dark:bg-gray-800 overflow-hidden">
      <div className="bg-gray-50 dark:bg-gray-800 p-4 border-b dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            {aiProviderStatus.provider !== AIProviderType.NONE 
              ? 'Voice-Enabled Form Editor' 
              : 'Form Editor'
            }
          </h3>
          <div className="flex space-x-2">
            {showVoiceFeatures && (
              <>
                <Button 
                  type="button" 
                  size="sm" 
                  variant={isPlaying ? "secondary" : "outline"}
                  onClick={handleSpeechToggle}
                  disabled={isSpeaking || messages.length <= 1}
                  className="flex items-center space-x-1 h-8 px-2"
                  title={isPlaying ? "Stop speaking" : "Speak last response"}
                >
                  {isPlaying ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  <span className="ml-1 text-xs">{isPlaying ? "Stop" : "Speak"}</span>
                </Button>
                <Button 
                  type="button" 
                  size="sm" 
                  variant={isRecording ? "destructive" : "outline"}
                  onClick={handleVoiceToggle}
                  disabled={isTranscribing}
                  className="flex items-center space-x-1 h-8 px-2"
                  title={isRecording ? "Stop recording and send message" : "Start recording"}
                >
                  {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                  <span className="ml-1 text-xs">{isRecording ? "Stop & Send" : "Record"}</span>
                </Button>
              </>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {aiProviderStatus.provider !== AIProviderType.NONE
            ? 'Speak or type to update any field in the form'
            : 'Type to update any field in the form'
          }
        </p>
        {aiProviderStatus.provider === AIProviderType.GEMINI && (
          <div className="flex items-center mt-2 p-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
            <AlertCircle size={14} className="mr-1 flex-shrink-0" />
            <span>Using text-only mode with Gemini AI. Voice features are not available.</span>
          </div>
        )}
        {aiProviderStatus.provider === AIProviderType.NONE && (
          <div className="flex items-center mt-2 p-2 text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
            <AlertCircle size={14} className="mr-1 flex-shrink-0" />
            <span>AI assistant is unavailable. Please edit the form fields directly.</span>
          </div>
        )}
        {(recordingError || ttsError) && (
          <div className="flex items-center mt-2 p-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
            <AlertCircle size={14} className="mr-1 flex-shrink-0" />
            <span>{recordingError || ttsError}</span>
          </div>
        )}
        {isRecording && (
          <div className="flex items-center mt-2 p-2 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
            <span className="mr-2 h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>Recording... Speak clearly, then click <b>Stop & Send</b> to send your message.</span>
          </div>
        )}
        {isTranscribing && (
          <div className="flex items-center mt-2 p-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
            <Loader2 size={14} className="mr-1 animate-spin" />
            <span>Transcribing your message...</span>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] rounded-lg p-3 shadow-sm ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              }`}
            >
              {message.content}
              {message.role === 'assistant' && index === messages.length - 1 && aiProviderStatus.hasVoiceFeatures && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex justify-end">
                  {isPlaying && (
                    <span className="flex items-center">
                      <Volume2 size={12} className="mr-1" />
                      Playing audio...
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="border-t dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border rounded-md px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            disabled={isProcessing || aiProviderStatus.provider === AIProviderType.NONE}
          />
          <Button 
            type="submit" 
            size="sm"
            disabled={!userInput.trim() || isProcessing || aiProviderStatus.provider === AIProviderType.NONE}
            className="h-10 px-4"
          >
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
} 