// Company types
export interface Company {
  id: string;
  name: string;
  industry: string;
}

// Memory types
export interface CompanyMemory {
  companyId: string;
  structuredData: StructuredCompanyData;
  unstructuredData: UnstructuredData[];
}

export interface StructuredCompanyData {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  industry: string;
  employeeCount: number;
  annualRevenue: number;
  yearFounded: number;
  website: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

export interface UnstructuredData {
  type: 'call_transcript' | 'email' | 'note';
  date: string;
  content: string;
}

// Form types
export interface InsuranceForm {
  companyName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  industry: string;
  employeeCount: number;
  annualRevenue: number;
  yearFounded: number;
  deductibleAmount: number;
  coverageLimit: number;
  effectiveDate: string;
  expirationDate: string;
  premiumAmount: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  additionalNotes: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
} 