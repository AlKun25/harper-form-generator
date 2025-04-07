import React from 'react';
import { useFormContext } from './FormProvider';
import { InsuranceForm } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormSidebarProps {
  className?: string;
}

export default function FormSidebar({ className = '' }: FormSidebarProps) {
  const { form, updateForm, currentSection } = useFormContext();

  const handleInputChange = (field: keyof InsuranceForm, value: string | number) => {
    updateForm({ [field]: value });
  };

  // Group fields by sections
  const sections = {
    'Company Information': [
      { key: 'companyName', label: 'Company Name', type: 'text' },
      { key: 'industry', label: 'Industry', type: 'text' },
      { key: 'yearFounded', label: 'Year Founded', type: 'number' },
      { key: 'employeeCount', label: 'Number of Employees', type: 'number' },
      { key: 'annualRevenue', label: 'Annual Revenue ($)', type: 'number' },
    ],
    'Contact Information': [
      { key: 'contactName', label: 'Contact Name', type: 'text' },
      { key: 'contactEmail', label: 'Contact Email', type: 'email' },
      { key: 'contactPhone', label: 'Contact Phone', type: 'tel' },
    ],
    'Location': [
      { key: 'address', label: 'Address', type: 'text' },
      { key: 'city', label: 'City', type: 'text' },
      { key: 'state', label: 'State', type: 'text' },
      { key: 'zipCode', label: 'ZIP Code', type: 'text' },
    ],
    'Coverage Details': [
      { key: 'deductibleAmount', label: 'Deductible Amount ($)', type: 'number' },
      { key: 'coverageLimit', label: 'Coverage Limit ($)', type: 'number' },
      { key: 'effectiveDate', label: 'Effective Date', type: 'date' },
      { key: 'expirationDate', label: 'Expiration Date', type: 'date' },
      { key: 'premiumAmount', label: 'Premium Amount ($)', type: 'number' },
    ],
    'Additional Information': [
      { key: 'additionalNotes', label: 'Additional Notes', type: 'textarea' },
    ],
  };

  return (
    <div className={`overflow-auto p-4 ${className}`}>
      {Object.entries(sections).map(([section, fields]) => (
        <Card 
          key={section} 
          className={`mb-4 ${currentSection === section ? 'ring-2 ring-primary' : ''}`}
        >
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-lg">{section}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {fields.map(field => (
              <div key={field.key} className="mb-4">
                <Label 
                  htmlFor={field.key}
                  className="text-sm font-medium"
                >
                  {field.label}
                </Label>
                
                {field.type === 'textarea' ? (
                  <textarea
                    id={field.key}
                    value={form[field.key as keyof InsuranceForm] || ''}
                    onChange={(e) => handleInputChange(field.key as keyof InsuranceForm, e.target.value)}
                    className="w-full mt-1 rounded-md border border-gray-300 p-2 text-sm"
                    rows={3}
                  />
                ) : (
                  <Input
                    id={field.key}
                    type={field.type}
                    value={form[field.key as keyof InsuranceForm] || ''}
                    onChange={(e) => handleInputChange(
                      field.key as keyof InsuranceForm, 
                      field.type === 'number' ? Number(e.target.value) : e.target.value
                    )}
                    className="w-full mt-1"
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 