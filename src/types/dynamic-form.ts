/**
 * Dynamic Form Schema Types
 */

// Define the field types available in our dynamic forms
export type FieldType = 
  | 'text' 
  | 'number' 
  | 'date' 
  | 'email' 
  | 'tel' 
  | 'url' 
  | 'textarea' 
  | 'checkbox' 
  | 'select';

// Definition for a single form field
export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[]; // For select fields
  defaultValue?: any;
}

// A section of the form containing multiple fields
export interface FormSection {
  id: string;
  title: string;
  fields: FormField[];
}

// The complete form schema
export interface DynamicFormSchema {
  title: string;
  sections: FormSection[];
}

// Request to generate a form
export interface FormGenerationRequest {
  prompt: string;
  openaiKey: string;
}

// Response from the form generation API
export interface FormGenerationResponse {
  success: boolean;
  data?: DynamicFormSchema;
  error?: string;
}

// Example personal information form schema
export const EXAMPLE_PERSONAL_INFO_SCHEMA: DynamicFormSchema = {
  title: "Personal Information Form",
  sections: [
    {
      id: "personal_info",
      title: "Personal Information",
      fields: [
        {
          id: "firstName",
          label: "First Name",
          type: "text",
          placeholder: "Enter your first name",
          required: true
        },
        {
          id: "lastName",
          label: "Last Name",
          type: "text",
          placeholder: "Enter your last name",
          required: true
        },
        {
          id: "dateOfBirth",
          label: "Date of Birth",
          type: "date",
          required: true
        },
        {
          id: "gender",
          label: "Gender",
          type: "select",
          options: [
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
            { value: "other", label: "Other" },
            { value: "prefer_not_to_say", label: "Prefer not to say" }
          ],
          required: true
        }
      ]
    },
    {
      id: "contact_info",
      title: "Contact Information",
      fields: [
        {
          id: "email",
          label: "Email Address",
          type: "email",
          placeholder: "Enter your email",
          required: true
        },
        {
          id: "phone",
          label: "Phone Number",
          type: "tel",
          placeholder: "Enter your phone number"
        },
        {
          id: "address",
          label: "Address",
          type: "textarea",
          placeholder: "Enter your full address"
        }
      ]
    }
  ]
}; 