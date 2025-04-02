import { useState } from 'react';
import { ACORD125Form } from '@/types/acord125';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ACORD125FormProps {
  formData: ACORD125Form;
  onEditForm: (updates: Partial<ACORD125Form>) => void;
}

export function ACORD125FormComponent({ formData, onEditForm }: ACORD125FormProps) {
  const [editing, setEditing] = useState(false);
  const [formState, setFormState] = useState(formData);

  const handleEdit = () => {
    setEditing(true);
  };

  const handleSave = () => {
    onEditForm(formState);
    setEditing(false);
  };

  const handleCancel = () => {
    setFormState(formData);
    setEditing(false);
  };

  const handleChange = (path: string[], value: any) => {
    const newState = { ...formState };
    let current = newState;
    
    // Navigate to the nested property
    for (let i = 0; i < path.length - 1; i++) {
      if (current[path[i]] === undefined) {
        current[path[i]] = {};
      }
      current = current[path[i]];
    }
    
    // Set the value
    current[path[path.length - 1]] = value;
    setFormState(newState);
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
      value = value[key];
    }
    
    // Handle value types
    if (type === 'number' && typeof value !== 'number') {
      value = value ? parseFloat(value) || 0 : 0;
    }
    
    // Return the appropriate field based on type
    switch (type) {
      case 'textarea':
        return (
          <div className={cn("mb-4", className)}>
            <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</Label>
            <Textarea 
              placeholder={placeholder}
              value={value || ''}
              readOnly={readOnly}
              className={cn("w-full", readOnly && "bg-gray-50 dark:bg-gray-800")}
              onChange={(e) => handleChange(path, e.target.value)}
            />
          </div>
        );
      case 'checkbox':
        return (
          <div className={cn("flex items-center gap-2 mb-4", className)}>
            <Checkbox 
              id={path.join('.')}
              checked={!!value}
              disabled={readOnly}
              onCheckedChange={(checked) => handleChange(path, !!checked)}
            />
            <Label 
              htmlFor={path.join('.')}
              className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              {label}
            </Label>
          </div>
        );
      default:
        return (
          <div className={cn("mb-4", className)}>
            <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</Label>
            <Input 
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
            />
          </div>
        );
    }
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Card className="mb-6">
      <CardHeader className="py-4">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">ACORD 125 - Commercial Insurance Application</h2>
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
          <Field label="Entity Type" path={['applicant_information', 'named_insured', 'entity_type']} />
          <Field label="Street Address" path={['applicant_information', 'named_insured', 'mailing_address', 'street_address']} />
          <Field label="City" path={['applicant_information', 'named_insured', 'mailing_address', 'city']} />
          <Field label="State" path={['applicant_information', 'named_insured', 'mailing_address', 'state']} />
          <Field label="ZIP Code" path={['applicant_information', 'named_insured', 'mailing_address', 'zip']} />
          <Field label="Business Phone" path={['applicant_information', 'named_insured', 'business_phone']} type="tel" />
          <Field label="Website" path={['applicant_information', 'named_insured', 'website_address']} type="url" />
          <Field label="FEIN/SSN" path={['applicant_information', 'named_insured', 'fein_or_soc_sec']} />
          <Field label="NAICS Code" path={['applicant_information', 'named_insured', 'naics']} />
          <Field label="SIC Code" path={['applicant_information', 'named_insured', 'sic']} />
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

      {/* Nature of Business */}
      <Section title="Nature of Business">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Business Type" path={['nature_of_business', 'business_type']} />
          <Field label="Date Business Started" path={['nature_of_business', 'date_business_started']} type="date" />
          <Field 
            label="Description of Operations" 
            path={['nature_of_business', 'description_primary_operations']} 
            type="textarea"
            className="col-span-1 md:col-span-2"
          />
        </div>
      </Section>

      {/* Premises Information */}
      <Section title="Premises Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Street" path={['premises_information', 'location', 'street']} />
          <Field label="City" path={['premises_information', 'location', 'city']} />
          <Field label="State" path={['premises_information', 'location', 'state']} />
          <Field label="ZIP" path={['premises_information', 'location', 'zip']} />
          <Field label="Full Time Employees" path={['premises_information', 'location', 'full_time_employees']} type="number" />
          <Field label="Part Time Employees" path={['premises_information', 'location', 'part_time_employees']} type="number" />
          <Field label="Annual Revenues" path={['premises_information', 'location', 'annual_revenues']} type="number" />
          <Field 
            label="Description of Operations" 
            path={['premises_information', 'location', 'description_of_operations']} 
            type="textarea"
            className="col-span-1 md:col-span-2"
          />
        </div>
      </Section>

      {/* General Information */}
      <Section title="General Information">
        <div className="space-y-4">
          <Field label="Has Subsidiaries" path={['general_information', 'has_subsidiaries']} type="checkbox" />
          
          <div className="pl-6 border-l-2 border-gray-200 dark:border-gray-700 mb-4">
            <h4 className="font-medium mb-2">Safety Program</h4>
            <Field label="Has Safety Program" path={['general_information', 'safety_program', 'has_program']} type="checkbox" />
            <Field label="Has Safety Manual" path={['general_information', 'safety_program', 'safety_manual']} type="checkbox" />
            <Field label="Has Monthly Safety Meetings" path={['general_information', 'safety_program', 'monthly_meetings']} type="checkbox" />
          </div>
          
          <div className="pl-6 border-l-2 border-gray-200 dark:border-gray-700 mb-4">
            <h4 className="font-medium mb-2">Exposures</h4>
            <Field label="Has Exposure to Hazards" path={['general_information', 'exposures', 'has_exposure_to_hazards']} type="checkbox" />
            <Field label="Details" path={['general_information', 'exposures', 'details']} type="textarea" />
          </div>
          
          <div className="pl-6 border-l-2 border-gray-200 dark:border-gray-700 mb-4">
            <h4 className="font-medium mb-2">Prior Cancellations</h4>
            <Field label="Has Prior Cancellations" path={['general_information', 'prior_cancellations', 'has_prior_cancellations']} type="checkbox" />
            <Field label="Reason" path={['general_information', 'prior_cancellations', 'reason']} />
          </div>
          
          <div className="pl-6 border-l-2 border-gray-200 dark:border-gray-700">
            <h4 className="font-medium mb-2">Bankruptcy</h4>
            <Field label="Has Bankruptcy" path={['general_information', 'bankruptcy', 'has_bankruptcy']} type="checkbox" />
            <Field label="Details" path={['general_information', 'bankruptcy', 'details']} />
          </div>
        </div>
      </Section>

      {/* Prior Carrier Information */}
      <Section title="Prior Carrier Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Carrier Name" path={['prior_carrier_information', 'carrier_name']} />
          <Field label="Policy Number" path={['prior_carrier_information', 'policy_number']} />
          <Field label="Effective Date" path={['prior_carrier_information', 'effective_date']} type="date" />
          <Field label="Expiration Date" path={['prior_carrier_information', 'expiration_date']} type="date" />
          <Field label="Premium" path={['prior_carrier_information', 'premium']} type="number" />
        </div>
      </Section>

      {/* Loss History */}
      <Section title="Loss History">
        <div className="space-y-4">
          <Field label="Has Losses" path={['loss_history', 'has_losses']} type="checkbox" />
          
          {formState.loss_history.has_losses && (
            <div className="pl-6 border-l-2 border-gray-200 dark:border-gray-700">
              <h4 className="font-medium mb-2">Claims</h4>
              
              {formState.loss_history.claims.map((claim, index) => (
                <div key={index} className="p-4 mb-4 border border-gray-200 dark:border-gray-700 rounded-md">
                  <h5 className="font-medium mb-2">Claim #{index + 1}</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field 
                      label="Date of Occurrence" 
                      path={['loss_history', 'claims', index, 'date_of_occurrence']} 
                    />
                    <Field 
                      label="Status" 
                      path={['loss_history', 'claims', index, 'status']} 
                    />
                    <Field 
                      label="Amount Paid" 
                      path={['loss_history', 'claims', index, 'amount_paid']} 
                      type="number" 
                    />
                    <Field 
                      label="Amount Reserved" 
                      path={['loss_history', 'claims', index, 'amount_reserved']} 
                      type="number" 
                    />
                    <Field 
                      label="Description" 
                      path={['loss_history', 'claims', index, 'description']} 
                      type="textarea" 
                      className="col-span-1 md:col-span-2"
                    />
                  </div>
                </div>
              ))}
              
              <div className="mt-4">
                <Field label="Total Losses" path={['loss_history', 'total_losses']} type="number" />
              </div>
            </div>
          )}
        </div>
      </Section>

      <CardFooter className="flex justify-end space-x-2">
        {editing ? (
          <>
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </>
        ) : (
          <Button onClick={handleEdit}>Edit Form</Button>
        )}
      </CardFooter>
    </div>
  );
} 