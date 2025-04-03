import { useState, ReactNode, useEffect } from 'react';
import { ACORD126Form } from '@/types/acord126';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ACORD126FormProps {
  formData: ACORD126Form;
  onEditForm: (updates: Partial<ACORD126Form>) => void;
}

export function ACORD126FormComponent({ formData, onEditForm }: ACORD126FormProps) {
  const [editing, setEditing] = useState(false);
  const [formState, setFormState] = useState(formData);

  // Update formState when formData changes
  useEffect(() => {
    console.log('ACORD126Form: Parent form data changed', formData);
    console.log('ACORD126Form: Setting new state');
    
    // Create a new object to trigger re-render
    const newState = JSON.parse(JSON.stringify(formData));
    setFormState(newState);
    
    // If editing, set to false to reset the editing state
    if (editing) {
      console.log('ACORD126Form: Resetting edit mode');
      setEditing(false);
    }
  }, [formData]);

  const handleEdit = () => {
    console.log('ACORD126Form: Entering edit mode');
    setEditing(true);
  };

  const handleSave = () => {
    console.log('ACORD126Form: Saving changes', formState);
    onEditForm(formState);
    setEditing(false);
  };

  const handleCancel = () => {
    console.log('ACORD126Form: Cancelling changes');
    setFormState(formData);
    setEditing(false);
  };

  const handleChange = (path: string[], value: any) => {
    // Create a deep copy of the current form state
    const newState = JSON.parse(JSON.stringify(formState));
    
    // Navigate to the nested property and set the value
    let current = newState;
    for (let i = 0; i < path.length - 1; i++) {
      if (current[path[i]] === undefined) {
        current[path[i]] = {};
      }
      current = current[path[i]];
    }
    
    // Set the final property value
    current[path[path.length - 1]] = value;
    
    // Update local state
    setFormState(newState);
    
    // Immediately update the parent form
    onEditForm(newState);
  };

  const Section = ({ title, children }: { title: string; children: ReactNode }) => {
    // Create a slug version of the title for use in IDs
    const sectionSlug = title.toLowerCase().replace(/\s+/g, '-');
    
    return (
      <Card className="mb-6">
        <CardHeader className="py-4">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div data-section={sectionSlug}>
            {children}
          </div>
        </CardContent>
      </Card>
    );
  };

  const Field = ({ 
    label, 
    path, 
    type = 'text',
    placeholder = '',
    readOnly = !editing,
    className = ''
  }: { 
    label: string; 
    path: string[]; 
    type?: 'text' | 'number' | 'date' | 'email' | 'tel' | 'url' | 'textarea' | 'checkbox';
    placeholder?: string;
    readOnly?: boolean;
    className?: string;
  }) => {
    // Get the current value from the path
    let value: any = formState;
    for (const key of path) {
      if (value === undefined) break;
      value = value[key as keyof typeof value];
    }
    
    // Handle value types
    if (type === 'number' && typeof value !== 'number') {
      value = value ? parseFloat(value) || 0 : 0;
    }
    
    // Get the section ID from the path's first segment as a fallback
    const getSectionId = () => {
      return path[0] || '';
    };
    
    // Create a field ID that combines section ID and field label
    const fieldId = `${getSectionId()}-${label.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Return the appropriate field based on type
    switch (type) {
      case 'textarea':
        return (
          <div className={cn("mb-4", className)}>
            <Label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</Label>
            <Textarea 
              id={fieldId}
              placeholder={placeholder}
              value={value || ''}
              readOnly={readOnly}
              className={cn("w-full", readOnly && "bg-gray-50 dark:bg-gray-800")}
              onChange={(e) => handleChange(path, e.target.value)}
              data-field-path={path.join('.')}
              onBlur={(e) => {
                if (e.relatedTarget && e.relatedTarget.closest('form')) {
                  return;
                }
                if (!readOnly) e.target.focus();
              }}
            />
          </div>
        );
      case 'checkbox':
        return (
          <div className={cn("flex items-center gap-2 mb-4", className)}>
            <Checkbox 
              id={fieldId}
              checked={!!value}
              disabled={readOnly}
              onCheckedChange={(checked) => handleChange(path, !!checked)}
              data-field-path={path.join('.')}
            />
            <Label 
              htmlFor={fieldId}
              className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              {label}
            </Label>
          </div>
        );
      default:
        return (
          <div className={cn("mb-4", className)}>
            <Label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</Label>
            <Input 
              id={fieldId}
              type={type}
              placeholder={placeholder}
              value={type === 'number' ? (value || 0) : (value || '')}
              readOnly={readOnly}
              className={cn("w-full", readOnly && "bg-gray-50 dark:bg-gray-800")}
              onChange={(e) => {
                const newValue = type === 'number' 
                  ? parseFloat(e.target.value) 
                  : e.target.value;
                handleChange(path, newValue);
              }}
              data-field-path={path.join('.')}
              onBlur={(e) => {
                if (e.relatedTarget && e.relatedTarget.closest('form')) {
                  return;
                }
                if (!readOnly) e.target.focus();
              }}
            />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">ACORD 126 - Commercial General Liability Section</h2>
        <div className="space-x-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
              <Button onClick={handleSave}>Save</Button>
            </>
          ) : (
            <Button onClick={handleEdit}>Edit Form</Button>
          )}
        </div>
      </div>

      {/* Header Information */}
      <Section title="Header Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Date" path={['date']} type="date" />
          <div />
          <Field label="Agency Name" path={['agency', 'name']} />
          <Field label="Agency Contact" path={['agency', 'contact_name']} />
          <Field label="Carrier Name" path={['carrier', 'name']} />
          <Field label="Policy Number" path={['carrier', 'policy_number']} />
          <Field label="Transaction Type" path={['status_of_transaction', 'transaction_type']} />
        </div>
      </Section>

      {/* Applicant Information */}
      <Section title="Applicant Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Named Insured" path={['applicant_information', 'named_insured', 'name']} />
          <Field label="Street Address" path={['applicant_information', 'named_insured', 'mailing_address', 'street_address']} />
          <Field label="City" path={['applicant_information', 'named_insured', 'mailing_address', 'city']} />
          <Field label="State" path={['applicant_information', 'named_insured', 'mailing_address', 'state']} />
          <Field label="ZIP Code" path={['applicant_information', 'named_insured', 'mailing_address', 'zip']} />
          <Field label="Business Phone" path={['applicant_information', 'named_insured', 'business_phone']} type="tel" />
          <Field label="Website" path={['applicant_information', 'named_insured', 'website_address']} type="url" />
        </div>
      </Section>

      {/* Contact Information */}
      <Section title="Contact Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Contact Name" path={['contact_information', 'contact_name']} />
          <Field label="Phone Number" path={['contact_information', 'primary_phone']} type="tel" />
          <Field label="Email" path={['contact_information', 'primary_email']} type="email" />
        </div>
      </Section>

      {/* Policy Information */}
      <Section title="Policy Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Proposed Effective Date" path={['policy_information', 'proposed_eff_date']} type="date" />
          <Field label="Proposed Expiration Date" path={['policy_information', 'proposed_exp_date']} type="date" />
          
          <h3 className="text-md font-semibold col-span-2 mt-2">Limits of Liability</h3>
          <Field label="Each Occurrence" path={['policy_information', 'limits_of_liability', 'each_occurrence']} />
          <Field label="Damage to Rented Premises" path={['policy_information', 'limits_of_liability', 'damage_to_rented_premises']} />
          <Field label="Medical Expense" path={['policy_information', 'limits_of_liability', 'medical_expense']} />
          <Field label="Personal & Advertising Injury" path={['policy_information', 'limits_of_liability', 'personal_and_advertising_injury']} />
          <Field label="General Aggregate" path={['policy_information', 'limits_of_liability', 'general_aggregate']} />
          <Field label="Products-Completed Operations Aggregate" path={['policy_information', 'limits_of_liability', 'products_completed_operations_aggregate']} />
          
          <h3 className="text-md font-semibold col-span-2 mt-2">Deductible</h3>
          <Field label="Type" path={['policy_information', 'deductible', 'type']} />
          <Field label="Amount" path={['policy_information', 'deductible', 'amount']} />
        </div>
      </Section>

      {/* Location Information */}
      <Section title="Location Information">
        {formState.locations.map((location, index) => (
          <div key={index} className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700 last:border-b-0 last:mb-0 last:pb-0">
            <h3 className="text-md font-semibold mb-4">Location {location.location_number}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Location Number" path={['locations', `${index}`, 'location_number']} />
              <Field label="Street Address" path={['locations', `${index}`, 'street_address']} />
              <Field label="City" path={['locations', `${index}`, 'city']} />
              <Field label="State" path={['locations', `${index}`, 'state']} />
              <Field label="ZIP Code" path={['locations', `${index}`, 'zip']} />
              <Field label="Interest" path={['locations', `${index}`, 'interest']} />
            </div>
            
            {location.additional_interests && location.additional_interests.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-2">Additional Interests</h4>
                {location.additional_interests.map((interest, interestIndex) => (
                  <div key={interestIndex} className="pl-4 mb-4 border-l-2 border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Name" path={['locations', `${index}`, 'additional_interests', `${interestIndex}`, 'name']} />
                      <Field label="Interest Type" path={['locations', `${index}`, 'additional_interests', `${interestIndex}`, 'interest_type']} />
                      <Field 
                        label="Certificate Required" 
                        path={['locations', `${index}`, 'additional_interests', `${interestIndex}`, 'certificate_required']} 
                        type="checkbox" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </Section>

      {/* Classifications */}
      <Section title="Classifications">
        {formState.classifications.map((classification, index) => (
          <div key={index} className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700 last:border-b-0 last:mb-0 last:pb-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Location Number" path={['classifications', `${index}`, 'location_number']} />
              <Field label="Classification Description" path={['classifications', `${index}`, 'classification_description']} />
              <Field label="Class Code" path={['classifications', `${index}`, 'class_code']} />
              <Field label="Premium Basis" path={['classifications', `${index}`, 'premium_basis']} />
              <Field label="Exposure" path={['classifications', `${index}`, 'exposure']} />
              <Field label="Territory" path={['classifications', `${index}`, 'territory']} />
              <Field label="Rate" path={['classifications', `${index}`, 'rate']} />
              <Field label="Premium" path={['classifications', `${index}`, 'premium']} />
            </div>
          </div>
        ))}
      </Section>

      {/* Coverage Information */}
      <Section title="Coverage Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Occurrence/Claims Made" path={['coverage_information', 'occurrence_claims_made']} />
          <Field label="Claims Made Retroactive Date" path={['coverage_information', 'claims_made_retroactive_date']} type="date" />
          <Field label="Employee Benefits Liability" path={['coverage_information', 'employee_benefits_liability']} type="checkbox" />
          <Field label="Number of Employees" path={['coverage_information', 'number_of_employees']} />
          <Field label="Deductible" path={['coverage_information', 'deductible']} />
          <Field label="Retroactive Date" path={['coverage_information', 'retroactive_date']} type="date" />
        </div>
        
        {formState.coverage_information.other_coverages && formState.coverage_information.other_coverages.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">Other Coverages</h4>
            {formState.coverage_information.other_coverages.map((coverage, index) => (
              <div key={index} className="pl-4 mb-4 border-l-2 border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Coverage Type" path={['coverage_information', 'other_coverages', `${index}`, 'coverage_type']} />
                  <Field label="Description" path={['coverage_information', 'other_coverages', `${index}`, 'description']} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Contractor Information */}
      <Section title="Contractor Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field 
            label="Does Applicant Subcontract Work?" 
            path={['contractor_information', 'does_applicant_subcontract_work']} 
            type="checkbox" 
          />
          <Field label="Percentage Subcontracted" path={['contractor_information', 'percentage_subcontracted']} />
          <Field label="Types of Work Subcontracted" path={['contractor_information', 'types_of_work_subcontracted']} />
          <Field label="Annual Cost of Subcontractors" path={['contractor_information', 'annual_cost_of_subcontractors']} />
          <Field 
            label="Are Certificates of Insurance Required?" 
            path={['contractor_information', 'are_certificates_of_insurance_required']} 
            type="checkbox" 
          />
          <Field label="Minimum Limit Requirements" path={['contractor_information', 'minimum_limit_requirements']} />
          <Field 
            label="Is Applicant Added as Additional Insured?" 
            path={['contractor_information', 'is_applicant_added_as_additional_insured']} 
            type="checkbox" 
          />
        </div>
      </Section>

      {/* Additional Questions */}
      <Section title="Additional Questions">
        <div className="grid grid-cols-1 gap-4">
          <Field 
            label="Has Discontinued Products?" 
            path={['additional_questions', 'has_discontinued_products']} 
            type="checkbox" 
          />
          {formState.additional_questions.has_discontinued_products && (
            <Field 
              label="Details" 
              path={['additional_questions', 'details_discontinued_products']} 
              type="textarea" 
            />
          )}
          
          <Field 
            label="Has Foreign Operations?" 
            path={['additional_questions', 'has_foreign_operations']} 
            type="checkbox" 
          />
          {formState.additional_questions.has_foreign_operations && (
            <Field 
              label="Details" 
              path={['additional_questions', 'details_foreign_operations']} 
              type="textarea" 
            />
          )}
          
          <Field 
            label="Has Hold Harmless Agreements?" 
            path={['additional_questions', 'has_hold_harmless_agreements']} 
            type="checkbox" 
          />
          {formState.additional_questions.has_hold_harmless_agreements && (
            <Field 
              label="Details" 
              path={['additional_questions', 'details_hold_harmless_agreements']} 
              type="textarea" 
            />
          )}
          
          <Field 
            label="Has Demolition Exposure?" 
            path={['additional_questions', 'has_demolition_exposure']} 
            type="checkbox" 
          />
          {formState.additional_questions.has_demolition_exposure && (
            <Field 
              label="Details" 
              path={['additional_questions', 'details_demolition_exposure']} 
              type="textarea" 
            />
          )}
          
          <Field 
            label="Has Independent Contractors?" 
            path={['additional_questions', 'has_independent_contractors']} 
            type="checkbox" 
          />
          {formState.additional_questions.has_independent_contractors && (
            <Field 
              label="Details" 
              path={['additional_questions', 'details_independent_contractors']} 
              type="textarea" 
            />
          )}
        </div>
      </Section>

      {/* Loss History */}
      <Section title="Loss History">
        <div className="mb-4">
          <Field 
            label="Has Losses or Claims in Last 5 Years?" 
            path={['loss_history', 'has_losses']} 
            type="checkbox" 
          />
        </div>
        
        {formState.loss_history.has_losses && (
          <div>
            {formState.loss_history.claims.map((claim, index) => (
              <div key={index} className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700 last:border-b-0 last:mb-0 last:pb-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Date of Occurrence" path={['loss_history', 'claims', `${index}`, 'date_of_occurrence']} />
                  <Field label="Status" path={['loss_history', 'claims', `${index}`, 'status']} />
                  <Field label="Amount Paid" path={['loss_history', 'claims', `${index}`, 'amount_paid']} />
                  <Field label="Amount Reserved" path={['loss_history', 'claims', `${index}`, 'amount_reserved']} />
                  <Field label="Description" path={['loss_history', 'claims', `${index}`, 'description']} />
                </div>
              </div>
            ))}
            
            <div className="mt-4">
              <Field label="Total Losses" path={['loss_history', 'total_losses']} />
            </div>
          </div>
        )}
      </Section>

      {/* Remarks */}
      <Section title="Remarks">
        <Field 
          label="Additional Remarks" 
          path={['remarks']} 
          type="textarea" 
        />
      </Section>
    </div>
  );
} 