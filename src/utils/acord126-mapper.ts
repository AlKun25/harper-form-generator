import { ACORD126Form } from '@/types/acord126';

interface Memory {
  company?: {
    json?: {
      company?: {
        id?: string;
        company_name?: string;
        company_primary_phone?: string;
        company_description?: string;
        company_naics_code?: string;
        company_sic_code?: string;
        company_legal_entity_type?: string;
        company_website?: string;
        company_industry?: string;
        company_sub_industry?: string;
        company_primary_email?: string;
        company_timezone?: string;
        company_street_address_1?: string;
        company_street_address_2?: string;
        company_city?: string;
        company_state?: string;
        company_postal_code?: string;
        insurance_types?: string[];
        company_annual_revenue_usd?: string;
        company_annual_payroll_usd?: string;
        company_sub_contractor_costs_usd?: string;
        company_full_time_employees?: number;
        company_part_time_employees?: number;
        company_years_in_business?: number;
        [key: string]: any;
      };
      contacts?: Array<{
        id?: string;
        company_id?: number;
        contact_first_name?: string;
        contact_last_name?: string;
        contact_primary_phone?: string;
        contact_primary_email?: string;
        contact_years_of_owner_experience?: number;
        [key: string]: any;
      }>;
      facts?: Array<{
        uuid?: string;
        content?: string;
        fact?: string;
        name?: string;
        source_node_name?: string;
        target_node_name?: string;
        created_at?: string;
        expired_at?: string | null;
        valid_at?: string | null;
        invalid_at?: string | null;
      }>;
    };
    md?: string;
    phone_events?: {
      json?: Array<{
        event?: string;
        direction?: string;
        content?: string;
        created_at?: string;
        metadata?: {
          call_transcript?: string;
          call_summary?: string;
          [key: string]: any;
        };
        [key: string]: any;
      }>;
      md?: string;
    };
  };
  
  // Backward compatibility - for handling different response structures
  company_json?: any;
  facts?: any[];
  phone_events?: any[];
  name?: string;
  memory?: any;
  data?: any;
  success?: boolean;
  [key: string]: any;
}

/**
 * Maps data from the memory API response to ACORD 126 form fields
 * @param memory Memory API response
 * @returns ACORD 126 form data
 */
export function mapMemoryToACORD126(memory: Memory): ACORD126Form {
  // Handle various possible response structures
  console.log("Memory data structure:", JSON.stringify(Object.keys(memory || {}), null, 2));
  
  // Handle null or undefined memory
  if (!memory) {
    console.log("Memory data is null or undefined");
    return createEmptyACORD126Form();
  }
  
  // Handle case where data is nested under 'data' property (API wrapper)
  if (memory.data && typeof memory.data === 'object') {
    return mapMemoryToACORD126(memory.data);
  }
  
  // Handle case where data is nested under 'memory' property
  if (memory.memory && typeof memory.memory === 'object') {
    return mapMemoryToACORD126(memory.memory);
  }
  
  interface CompanyJson {
    company?: {
      id?: string;
      company_name?: string;
      company_primary_phone?: string;
      [key: string]: any;
    };
    contacts?: Array<{
      id?: string;
      company_id?: number;
      contact_first_name?: string;
      contact_last_name?: string;
      [key: string]: any;
    }>;
  }
  
  let company_json: CompanyJson = {};
  let facts: Array<any> = [];
  let phone_events: Array<any> = [];
  
  // Handle the structure from memory_skeleton.md
  if (memory.company?.json) {
    company_json = {
      company: memory.company.json.company || {},
      contacts: memory.company.json.contacts || []
    };
    facts = memory.company.json.facts || [];
    
    // Extract phone events from the new structure
    if (memory.company.phone_events?.json) {
      phone_events = Array.isArray(memory.company.phone_events.json) ? memory.company.phone_events.json : [];
    }
  } 
  // Handle legacy structure
  else if (memory.company_json) {
    company_json = memory.company_json;
    facts = memory.facts || [];
    phone_events = Array.isArray(memory.phone_events) ? memory.phone_events : [];
  }
  // If the response has a different structure, try to adapt
  else if (memory.company && !memory.company.json) {
    company_json = {
      company: memory.company,
      contacts: memory.contacts || []
    };
    facts = memory.facts || [];
    phone_events = Array.isArray(memory.phone_events) ? memory.phone_events : [];
  }
  // Handle case where only memory data exists but company data is missing
  else if (memory.facts || memory.phone_events || memory.company?.phone_events) {
    console.log("Found memory data but company data is missing");
    
    // Create a minimal company structure with ID
    company_json = {
      company: { id: memory.id || memory.company_id || "unknown" },
      contacts: []
    };
    
    // Extract facts from any available location
    facts = memory.facts || 
            (memory.company?.json?.facts || []);
    
    // Extract phone events from any available location
    if (Array.isArray(memory.phone_events)) {
      phone_events = memory.phone_events;
    } else if (memory.company?.phone_events?.json) {
      phone_events = Array.isArray(memory.company.phone_events.json) ? memory.company.phone_events.json : [];
    } else {
      phone_events = [];
    }
  }
  
  // Fallback to empty objects if data is not available
  const company = company_json.company || {};
  const contacts = company_json.contacts || [];
  const contact = contacts.length > 0 ? contacts[0] : {};
  
  // Extract liability limits from facts or events
  const extractLiabilityLimits = () => {
    // Default values
    const defaultLimits = {
      each_occurrence: "",
      damage_to_rented_premises: "",
      medical_expense: "",
      personal_and_advertising_injury: "",
      general_aggregate: "",
      products_completed_operations_aggregate: "",
    };
    
    // Try to find limits in facts
    for (const fact of facts) {
      if (fact.fact?.toLowerCase().includes("each occurrence") || fact.content?.toLowerCase().includes("each occurrence")) {
        const match = (fact.fact || fact.content || "").match(/\$([0-9,]+)/);
        if (match) defaultLimits.each_occurrence = match[1];
      }
      if (fact.fact?.toLowerCase().includes("general aggregate") || fact.content?.toLowerCase().includes("general aggregate")) {
        const match = (fact.fact || fact.content || "").match(/\$([0-9,]+)/);
        if (match) defaultLimits.general_aggregate = match[1];
      }
      // Add other fields extraction...
    }
    
    return defaultLimits;
  };
  
  // Extract loss history from facts and events
  const extractLossHistory = () => {
    const claims = [];
    let hasLosses = false;
    
    // Look for loss information in facts
    for (const fact of facts) {
      const content = fact.fact || fact.content || "";
      if (content.toLowerCase().includes("claim") || content.toLowerCase().includes("loss")) {
        hasLosses = true;
        
        // Try to parse date, amount, and description
        const dateMatch = content.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
        const amountMatch = content.match(/\$([0-9,]+)/);
        
        claims.push({
          date_of_occurrence: dateMatch ? dateMatch[1] : "",
          description: content,
          amount_paid: amountMatch ? amountMatch[1] : "",
          amount_reserved: "",
          status: content.toLowerCase().includes("open") ? "Open" : content.toLowerCase().includes("closed") ? "Closed" : "",
        });
      }
    }
    
    // Look for loss information in phone events
    for (const event of phone_events) {
      const content = event.content || "";
      if (content.toLowerCase().includes("claim") || content.toLowerCase().includes("loss")) {
        hasLosses = true;
        
        // Try to parse date, amount, and description
        const dateMatch = content.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
        const amountMatch = content.match(/\$([0-9,]+)/);
        
        claims.push({
          date_of_occurrence: dateMatch ? dateMatch[1] : "",
          description: content,
          amount_paid: amountMatch ? amountMatch[1] : "",
          amount_reserved: "",
          status: content.toLowerCase().includes("open") ? "Open" : content.toLowerCase().includes("closed") ? "Closed" : "",
        });
      }
    }
    
    return {
      has_losses: hasLosses,
      claims,
      total_losses: "",
    };
  };
  
  // Extract subcontractor information
  const extractSubcontractorInfo = () => {
    let doesSubcontract = false;
    let percentageSubcontracted = "";
    let typesOfWork = "";
    let annualCost = "";
    let requiresCertificates = false;
    let minimumLimits = "";
    let isAddedAsInsured = false;
    
    // Look for subcontractor information in facts
    for (const fact of facts) {
      const content = fact.fact || fact.content || "";
      
      if (content.toLowerCase().includes("subcontract")) {
        doesSubcontract = true;
        
        // Try to find percentage
        const percentMatch = content.match(/(\d+)%/);
        if (percentMatch) percentageSubcontracted = percentMatch[1];
        
        // Try to find cost
        const costMatch = content.match(/\$([0-9,]+)/);
        if (costMatch) annualCost = costMatch[1];
        
        // Check if certificates are required
        if (content.toLowerCase().includes("certificate") || content.toLowerCase().includes("insurance")) {
          requiresCertificates = content.toLowerCase().includes("yes") || content.toLowerCase().includes("require");
        }
        
        // Check if added as additional insured
        if (content.toLowerCase().includes("additional insured")) {
          isAddedAsInsured = content.toLowerCase().includes("yes") || !content.toLowerCase().includes("no");
        }
      }
    }
    
    return {
      does_applicant_subcontract_work: doesSubcontract,
      percentage_subcontracted: percentageSubcontracted,
      types_of_work_subcontracted: typesOfWork,
      annual_cost_of_subcontractors: annualCost || company.company_sub_contractor_costs_usd || "",
      are_certificates_of_insurance_required: requiresCertificates,
      minimum_limit_requirements: minimumLimits,
      is_applicant_added_as_additional_insured: isAddedAsInsured,
    };
  };
  
  // Extract locations
  const extractLocations = () => {
    const locations = [{
      location_number: "1",
      street_address: company.company_street_address_1 || "",
      city: company.company_city || "",
      state: company.company_state || "",
      zip: company.company_postal_code || "",
      interest: "Owned",
      additional_interests: [],
    }];
    
    // Look for additional locations in facts
    for (const fact of facts) {
      const content = fact.fact || fact.content || "";
      if (content.toLowerCase().includes("location") && content.toLowerCase().includes("address")) {
        // Try to parse address components
        const addressMatch = content.match(/address:\s*([^,]+),\s*([^,]+),\s*([A-Z]{2})\s*(\d{5})/i);
        if (addressMatch) {
          locations.push({
            location_number: (locations.length + 1).toString(),
            street_address: addressMatch[1],
            city: addressMatch[2],
            state: addressMatch[3],
            zip: addressMatch[4],
            interest: "Owned",
            additional_interests: [],
          });
        }
      }
    }
    
    return locations;
  };
  
  // Map fields from memory to the ACORD 126 form
  return {
    date: new Date().toISOString().split('T')[0],
    agency: {
      name: "",
      contact_name: "",
      phone: "",
      fax: "",
      email: "",
      agency_customer_id: "",
    },
    carrier: {
      name: "",
      naic_code: "",
      policy_number: "",
    },
    status_of_transaction: {
      transaction_type: "New Business",
    },
    applicant_information: {
      named_insured: {
        name: company.company_name || "",
        mailing_address: {
          street_address: company.company_street_address_1 || "",
          city: company.company_city || "",
          state: company.company_state || "",
          zip: company.company_postal_code || "",
        },
        business_phone: company.company_primary_phone || "",
        website_address: company.company_website || "",
      },
    },
    policy_information: {
      proposed_eff_date: "",
      proposed_exp_date: "",
      limits_of_liability: extractLiabilityLimits(),
      deductible: {
        type: "",
        amount: "",
      },
    },
    locations: extractLocations(),
    classifications: [{
      location_number: "1",
      classification_description: company.company_description || "",
      class_code: "",
      premium_basis: "",
      exposure: "",
      territory: "",
      rate: "",
      premium: "",
    }],
    coverage_information: {
      occurrence_claims_made: "Occurrence",
      claims_made_retroactive_date: "",
      employee_benefits_liability: false,
      number_of_employees: String(company.company_full_time_employees || 0),
      deductible: "",
      retroactive_date: "",
      other_coverages: [],
    },
    contractor_information: extractSubcontractorInfo(),
    additional_questions: {
      has_discontinued_products: false,
      details_discontinued_products: "",
      has_foreign_operations: false,
      details_foreign_operations: "",
      has_hold_harmless_agreements: false,
      details_hold_harmless_agreements: "",
      has_demolition_exposure: false,
      details_demolition_exposure: "",
      has_independent_contractors: false,
      details_independent_contractors: "",
    },
    loss_history: extractLossHistory(),
    remarks: "",
  };
}

/**
 * Creates an empty ACORD 126 form
 * @returns Empty ACORD 126 form
 */
function createEmptyACORD126Form(): ACORD126Form {
  return {
    date: "",
    agency: {
      name: "",
      contact_name: "",
      phone: "",
      fax: "",
      email: "",
      agency_customer_id: "",
    },
    carrier: {
      name: "",
      naic_code: "",
      policy_number: "",
    },
    status_of_transaction: {
      transaction_type: "",
    },
    applicant_information: {
      named_insured: {
        name: "",
        mailing_address: {
          street_address: "",
          city: "",
          state: "",
          zip: "",
        },
        business_phone: "",
        website_address: "",
      },
    },
    policy_information: {
      proposed_eff_date: "",
      proposed_exp_date: "",
      limits_of_liability: {
        each_occurrence: "",
        damage_to_rented_premises: "",
        medical_expense: "",
        personal_and_advertising_injury: "",
        general_aggregate: "",
        products_completed_operations_aggregate: "",
      },
      deductible: {
        type: "",
        amount: "",
      },
    },
    locations: [],
    classifications: [],
    coverage_information: {
      occurrence_claims_made: "",
      claims_made_retroactive_date: "",
      employee_benefits_liability: false,
      number_of_employees: "",
      deductible: "",
      retroactive_date: "",
      other_coverages: [],
    },
    contractor_information: {
      does_applicant_subcontract_work: false,
      percentage_subcontracted: "",
      types_of_work_subcontracted: "",
      annual_cost_of_subcontractors: "",
      are_certificates_of_insurance_required: false,
      minimum_limit_requirements: "",
      is_applicant_added_as_additional_insured: false,
    },
    additional_questions: {
      has_discontinued_products: false,
      details_discontinued_products: "",
      has_foreign_operations: false,
      details_foreign_operations: "",
      has_hold_harmless_agreements: false,
      details_hold_harmless_agreements: "",
      has_demolition_exposure: false,
      details_demolition_exposure: "",
      has_independent_contractors: false,
      details_independent_contractors: "",
    },
    loss_history: {
      has_losses: false,
      claims: [],
      total_losses: "",
    },
    remarks: "",
  };
} 