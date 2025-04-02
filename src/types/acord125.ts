/**
 * ACORD 125 Form - Commercial Insurance Application
 */

export interface ACORD125Form {
  // Header Information
  date: string;
  agency: {
    name: string;
    contact_name: string;
    phone: string;
    fax: string;
    email: string;
    agency_customer_id: string;
  };
  carrier: {
    name: string;
    naic_code: string;
    policy_number: string;
  };
  status_of_transaction: {
    transaction_type: string;
  };

  // Policy Information
  policy_information: {
    proposed_eff_date: string;
    proposed_exp_date: string;
    billing_plan: string;
    payment_plan: string;
    policy_premium: number;
  };

  // Applicant Information
  applicant_information: {
    named_insured: {
      name: string;
      mailing_address: {
        street_address: string;
        city: string;
        state: string;
        zip: string;
      };
      gl_code: string;
      sic: string;
      naics: string;
      fein_or_soc_sec: string;
      business_phone: string;
      website_address: string;
      entity_type: string;
    };
  };

  // Contact Information
  contact_information: {
    contact_name: string;
    primary_phone: string;
    primary_email: string;
  };

  // Premises Information
  premises_information: {
    location: {
      street: string;
      city: string;
      state: string;
      zip: string;
      interest: string;
      full_time_employees: number;
      part_time_employees: number;
      annual_revenues: number;
      description_of_operations: string;
    };
  };

  // General Information
  general_information: {
    has_subsidiaries: boolean;
    safety_program: {
      has_program: boolean;
      safety_manual: boolean;
      monthly_meetings: boolean;
    };
    exposures: {
      has_exposure_to_hazards: boolean;
      details: string;
    };
    prior_cancellations: {
      has_prior_cancellations: boolean;
      reason: string;
    };
    bankruptcy: {
      has_bankruptcy: boolean;
      details: string;
    };
  };

  // Nature of Business
  nature_of_business: {
    business_type: string;
    date_business_started: string;
    description_primary_operations: string;
  };

  // Prior Carrier Information
  prior_carrier_information: {
    carrier_name: string;
    policy_number: string;
    effective_date: string;
    expiration_date: string;
    premium: number;
  };

  // Loss History
  loss_history: {
    has_losses: boolean;
    claims: Array<{
      date_of_occurrence: string;
      description: string;
      amount_paid: number;
      amount_reserved: number;
      status: string;
    }>;
    total_losses: number;
  };
} 