/**
 * ACORD 126 Form - Commercial General Liability Section
 */

export interface ACORD126Form {
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
      business_phone: string;
      website_address: string;
    };
  };

  // Policy Information
  policy_information: {
    proposed_eff_date: string;
    proposed_exp_date: string;
    limits_of_liability: {
      each_occurrence: string;
      damage_to_rented_premises: string;
      medical_expense: string;
      personal_and_advertising_injury: string;
      general_aggregate: string;
      products_completed_operations_aggregate: string;
    };
    deductible: {
      type: string;
      amount: string;
    };
  };

  // Location Information
  locations: Array<{
    location_number: string;
    street_address: string;
    city: string;
    state: string;
    zip: string;
    interest: string;
    additional_interests: Array<{
      name: string;
      interest_type: string;
      certificate_required: boolean;
    }>;
  }>;

  // Classifications
  classifications: Array<{
    location_number: string;
    classification_description: string;
    class_code: string;
    premium_basis: string;
    exposure: string;
    territory: string;
    rate: string;
    premium: string;
  }>;

  // Coverage Information
  coverage_information: {
    occurrence_claims_made: string;
    claims_made_retroactive_date: string;
    employee_benefits_liability: boolean;
    number_of_employees: string;
    deductible: string;
    retroactive_date: string;
    other_coverages: Array<{
      coverage_type: string;
      description: string;
    }>;
  };

  // Contractor Information
  contractor_information: {
    does_applicant_subcontract_work: boolean;
    percentage_subcontracted: string;
    types_of_work_subcontracted: string;
    annual_cost_of_subcontractors: string;
    are_certificates_of_insurance_required: boolean;
    minimum_limit_requirements: string;
    is_applicant_added_as_additional_insured: boolean;
  };

  // Additional Questions
  additional_questions: {
    has_discontinued_products: boolean;
    details_discontinued_products: string;
    has_foreign_operations: boolean;
    details_foreign_operations: string;
    has_hold_harmless_agreements: boolean;
    details_hold_harmless_agreements: string;
    has_demolition_exposure: boolean;
    details_demolition_exposure: string;
    has_independent_contractors: boolean;
    details_independent_contractors: string;
  };

  // Loss History
  loss_history: {
    has_losses: boolean;
    claims: Array<{
      date_of_occurrence: string;
      description: string;
      amount_paid: string;
      amount_reserved: string;
      status: string;
    }>;
    total_losses: string;
  };

  // Remarks
  remarks: string;
} 