import { ACORD125Form } from '@/types/acord125';

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
 * Maps data from the memory API response to ACORD 125 form fields
 * @param memory Memory API response
 * @returns ACORD 125 form data
 */
export function mapMemoryToACORD125(memory: Memory): ACORD125Form {
  // Handle various possible response structures
  console.log("Memory data structure:", JSON.stringify(Object.keys(memory || {}), null, 2));
  
  // Handle null or undefined memory
  if (!memory) {
    console.log("Memory data is null or undefined");
    return createEmptyACORD125Form();
  }
  
  // Log initial memory structure for debugging
  console.log("Memory top-level structure:", {
    hasCompany: !!memory.company,
    hasCompanyJson: !!memory.company?.json,
    hasCompanyData: !!memory.company?.json?.company,
    hasFacts: !!memory.facts || !!memory.company?.json?.facts,
    hasPhoneEvents: !!memory.phone_events || !!memory.company?.phone_events,
    factCount: (memory.facts?.length || 0) + (memory.company?.json?.facts?.length || 0),
    phoneEventCount: (memory.phone_events?.length || 0) + 
                    (Array.isArray(memory.company?.phone_events?.json) ? memory.company.phone_events.json.length : 0)
  });
  
  // Handle case where data is nested under 'data' property (API wrapper)
  if (memory.data && typeof memory.data === 'object') {
    return mapMemoryToACORD125(memory.data);
  }
  
  // Handle case where data is nested under 'memory' property
  if (memory.memory && typeof memory.memory === 'object') {
    return mapMemoryToACORD125(memory.memory);
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
  
  // Handle the new structure from memory_skeleton.md
  if (memory.company?.json) {
    company_json = {
      company: memory.company.json.company || {},
      contacts: memory.company.json.contacts || []
    };
    facts = memory.company.json.facts || [];
    
    // Extract phone events from the new structure - handle both cases even if company doesn't exist
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
  // Handle case where only memory data exists but company data is missing - THIS IS THE KEY CASE
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
    
    console.log(`Found ${facts.length} facts and ${phone_events.length} phone events`);
  }
  
  // Fallback to empty objects if data is not available
  const company = company_json.company || {};
  const contacts = company_json.contacts || [];
  const contact = contacts.length > 0 ? contacts[0] : {};
  
  // Extract company ID from various possible locations
  const getCompanyId = () => {
    if (company.id) return company.id;
    if (memory.id) return memory.id;
    if (memory.company_id) return memory.company_id;
    return '';
  };
  
  // Utility function to get federal ID from facts
  const getFederalId = () => {
    const federalIdFact = facts.find(fact => 
      fact.name === 'HAS_FEDERAL_ID' && 
      fact.fact &&
      (!fact.invalid_at || new Date(fact.invalid_at || '') > new Date())
    );
    
    if (federalIdFact?.fact) {
      // Try to extract the ID from the fact text
      const idMatch = federalIdFact.fact.match(/(\d{2}[-\s]?\d{7})/);
      if (idMatch) {
        return idMatch[1];
      }
    }
    
    return '';
  };
  
  // Calculate business start date based on years in business
  const calculateStartDate = () => {
    if (!company.company_years_in_business) return '';
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - Number(company.company_years_in_business);
    return `${startYear}-01-01`; // Default to January 1st of start year
  };
  
  // Extract loss history from facts and call transcripts
  const extractLossHistory = () => {
    const claims = [];
    let hasLosses = false;
    let totalLosses = 0;
    
    // Log what we're working with
    console.log(`Extracting loss history from ${facts.length} facts and ${phone_events.length} phone events`);
    
    // Check facts for claims
    const claimFacts = facts.filter(fact => 
      fact && 
      (fact.name === 'HISTORICAL_CLAIM' || fact.name === 'FILED_CLAIM' || fact.name === 'HAS_CLAIM') && 
      (!fact.invalid_at || new Date(fact.invalid_at || '') > new Date())
    );
    
    if (claimFacts.length > 0) {
      hasLosses = true;
      console.log(`Found ${claimFacts.length} claim facts`);
      
      for (const claimFact of claimFacts) {
        if (!claimFact.fact) continue;
        
        const factText = claimFact.fact;
        
        // Try to extract year from the fact text
        const yearMatch = factText.match(/\b(20\d{2}|19\d{2})\b/);
        const year = yearMatch ? yearMatch[1] : '';
        
        // Try to extract amount from the fact text
        const amountMatch = factText.match(/\$([0-9,]+)/);
        const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;
        
        if (amount > 0) {
          totalLosses += amount;
        }
        
        claims.push({
          date_of_occurrence: year ? `${year}-01-01` : '',
          description: factText,
          amount_paid: amount,
          amount_reserved: 0,
          status: facts.some(f => f.name === 'HAS_OPEN_CLAIM') ? 'Open' : 'Closed'
        });
      }
    }
    
    // Also check call transcripts for mentions of claims
    for (const event of phone_events) {
      const transcript = event.metadata?.call_transcript || '';
      if (!transcript) continue;
      
      const claimMatches = transcript.match(/(?:had|filed|made)(?:\s+a)?\s+claim(?:\s+for)?\s+([^.]+)/ig);
      if (claimMatches) {
        hasLosses = true;
        
        for (const claimMatch of claimMatches) {
          const claimDesc = claimMatch[1] || claimMatch;
          const yearMatch = claimDesc.match(/\b(20\d{2}|19\d{2})\b/);
          const year = yearMatch ? yearMatch[1] : '';
          
          const amountMatch = claimDesc.match(/\$([0-9,]+)/);
          const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;
          
          if (amount > 0) {
            totalLosses += amount;
          }
          
          claims.push({
            date_of_occurrence: year ? `${year}-01-01` : '',
            description: claimDesc,
            amount_paid: amount,
            amount_reserved: 0,
            status: claimDesc.toLowerCase().includes('open') ? 'Open' : 'Closed'
          });
        }
      }
    }
    
    return {
      has_losses: hasLosses,
      claims,
      total_losses: totalLosses
    };
  };
  
  // Extract prior carrier information
  const extractPriorCarrierInfo = () => {
    let carrierName = '';
    let policyNumber = '';
    let expirationDate = '';
    let premium = 0;
    
    console.log(`Extracting carrier info from ${phone_events.length} phone events`);
    
    // Look in call transcripts for insurance carrier info
    for (const event of phone_events) {
      // Handle potentially malformed phone events
      if (!event || typeof event !== 'object') {
        console.log('Skipping invalid phone event:', event);
        continue;
      }
      
      const transcript = event.metadata?.call_transcript || '';
      if (!transcript) {
        // Try alternative structures
        const altTranscript = event.call_transcript || event.transcript || '';
        if (!altTranscript) continue;
        
        // Use the alternative transcript instead
        const carrierMatch = altTranscript.match(/(?:insur(?:ance|er)|carrier|policy)(?:\s+is|\s+with)?\s+([A-Za-z& ]+)/i);
        if (carrierMatch) {
          carrierName = carrierMatch[1].trim();
        }
        
        // Continue with other extraction using altTranscript...
        continue;
      }
      
      // Look for carrier name
      const carrierMatch = transcript.match(/(?:insur(?:ance|er)|carrier|policy)(?:\s+is|\s+with)?\s+([A-Za-z& ]+)/i);
      if (carrierMatch) {
        carrierName = carrierMatch[1].trim();
      }
      
      // Look for policy expiration date
      const expirationMatch = transcript.match(/(?:expires?|expiration)\s+(?:date\s+)?(?:is\s+)?(?:on\s+)?([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?/i);
      if (expirationMatch) {
        const month = expirationMatch[1];
        const day = expirationMatch[2];
        const year = expirationMatch[3] || new Date().getFullYear();
        expirationDate = `${year}-${getMonthNumber(month)}-${day.padStart(2, '0')}`;
      }
      
      // Look for premium amount
      const premiumMatch = transcript.match(/(?:premium|cost|pay(?:ing)?|rate)\s+(?:is\s+)?(?:about\s+)?(?:approximately\s+)?\$([0-9,.]+)(?:\s+(?:per|a|annually|yearly))?/i);
      if (premiumMatch) {
        premium = parseFloat(premiumMatch[1].replace(/,/g, ''));
      }
    }
    
    // Also check facts for insurance rate
    const rateFact = facts.find(fact => 
      fact.name === 'IS_NOW_INSURANCE_RATE' && 
      (!fact.invalid_at || new Date(fact.invalid_at || '') > new Date())
    );
    
    if (rateFact?.content && !premium) {
      const rateMatch = rateFact.content.match(/\$([0-9,.]+)[kK]/);
      if (rateMatch) {
        premium = parseFloat(rateMatch[1]) * 1000;
      }
    }
    
    // Calculate effective date (if expiration is known, set 1 year prior)
    let effectiveDate = '';
    if (expirationDate) {
      const expDate = new Date(expirationDate);
      expDate.setFullYear(expDate.getFullYear() - 1);
      effectiveDate = expDate.toISOString().split('T')[0];
    }
    
    return {
      carrier_name: carrierName,
      policy_number: policyNumber,
      effective_date: effectiveDate,
      expiration_date: expirationDate,
      premium: premium
    };
  };

  // Helper to convert month name to number
  const getMonthNumber = (monthName: string): string => {
    const months: {[key: string]: string} = {
      'january': '01', 'february': '02', 'march': '03', 'april': '04',
      'may': '05', 'june': '06', 'july': '07', 'august': '08',
      'september': '09', 'october': '10', 'november': '11', 'december': '12'
    };
    
    return months[monthName.toLowerCase()] || '01';
  };

  // Create the ACORD 125 form object
  return {
    // Header Information
    date: new Date().toISOString().split('T')[0],
    agency: {
      name: 'Harper Insurance',
      contact_name: '',
      phone: '',
      fax: '',
      email: '',
      agency_customer_id: getCompanyId()
    },
    carrier: {
      name: '',
      naic_code: '',
      policy_number: ''
    },
    status_of_transaction: {
      transaction_type: 'New Business'
    },

    // Policy Information
    policy_information: {
      proposed_eff_date: '',
      proposed_exp_date: '',
      billing_plan: '',
      payment_plan: '',
      policy_premium: 0
    },

    // Applicant Information
    applicant_information: {
      named_insured: {
        name: company.company_name || '',
        mailing_address: {
          street_address: [company.company_street_address_1, company.company_street_address_2].filter(Boolean).join(', '),
          city: company.company_city || '',
          state: company.company_state || '',
          zip: company.company_postal_code || ''
        },
        gl_code: '',
        sic: company.company_sic_code || '',
        naics: company.company_naics_code || '',
        fein_or_soc_sec: getFederalId(),
        business_phone: company.company_primary_phone || '',
        website_address: company.company_website || '',
        entity_type: company.company_legal_entity_type || ''
      }
    },

    // Contact Information
    contact_information: {
      contact_name: `${contact.contact_first_name || ''} ${contact.contact_last_name || ''}`.trim(),
      primary_phone: contact.contact_primary_phone || company.company_primary_phone || '',
      primary_email: contact.contact_primary_email || company.company_primary_email || ''
    },

    // Premises Information
    premises_information: {
      location: {
        street: company.company_street_address_1 || '',
        city: company.company_city || '',
        state: company.company_state || '',
        zip: company.company_postal_code || '',
        interest: '',
        full_time_employees: company.company_full_time_employees || 0,
        part_time_employees: company.company_part_time_employees || 0,
        annual_revenues: parseFloat(company.company_annual_revenue_usd?.replace(/,/g, '') || '0'),
        description_of_operations: company.company_description || ''
      }
    },

    // General Information
    general_information: {
      has_subsidiaries: false,
      safety_program: {
        has_program: facts.some(fact => fact.name === 'SAFETY_MEETINGS_FREQUENCY'),
        safety_manual: false,
        monthly_meetings: facts.some(fact => 
          fact.name === 'SAFETY_MEETINGS_FREQUENCY' && 
          fact.target_node_name?.toLowerCase().includes('monthly')
        )
      },
      exposures: {
        has_exposure_to_hazards: facts.some(fact => 
          fact.name === 'USES' && 
          (fact.target_node_name?.toLowerCase().includes('chemical') || 
           fact.target_node_name?.toLowerCase().includes('hazard') ||
           fact.target_node_name?.toLowerCase().includes('explosive'))
        ),
        details: ''
      },
      prior_cancellations: {
        has_prior_cancellations: facts.some(fact => fact.name === 'POLICY_CANCELLED'),
        reason: ''
      },
      bankruptcy: {
        has_bankruptcy: facts.some(fact => 
          fact.name === 'HAS_BANKRUPTCIES' && 
          fact.fact?.toLowerCase().includes('yes')),
        details: ''
      }
    },

    // Nature of Business
    nature_of_business: {
      business_type: company.company_industry || '',
      date_business_started: calculateStartDate(),
      description_primary_operations: [
        company.company_description || '', 
        company.company_sub_industry || ''
      ].filter(Boolean).join(' - ')
    },

    // Prior Carrier Information
    prior_carrier_information: extractPriorCarrierInfo(),

    // Loss History
    loss_history: extractLossHistory()
  };
}

// Create an empty ACORD125 form with default values
function createEmptyACORD125Form(): ACORD125Form {
  return {
    date: new Date().toISOString().split('T')[0],
    agency: {
      name: 'Harper Insurance',
      contact_name: '',
      phone: '',
      fax: '',
      email: '',
      agency_customer_id: ''
    },
    carrier: {
      name: '',
      naic_code: '',
      policy_number: ''
    },
    status_of_transaction: {
      transaction_type: 'New Business'
    },
    policy_information: {
      proposed_eff_date: '',
      proposed_exp_date: '',
      billing_plan: '',
      payment_plan: '',
      policy_premium: 0
    },
    applicant_information: {
      named_insured: {
        name: '',
        mailing_address: {
          street_address: '',
          city: '',
          state: '',
          zip: ''
        },
        gl_code: '',
        sic: '',
        naics: '',
        fein_or_soc_sec: '',
        business_phone: '',
        website_address: '',
        entity_type: ''
      }
    },
    contact_information: {
      contact_name: '',
      primary_phone: '',
      primary_email: ''
    },
    premises_information: {
      location: {
        street: '',
        city: '',
        state: '',
        zip: '',
        interest: '',
        full_time_employees: 0,
        part_time_employees: 0,
        annual_revenues: 0,
        description_of_operations: ''
      }
    },
    general_information: {
      has_subsidiaries: false,
      safety_program: {
        has_program: false,
        safety_manual: false,
        monthly_meetings: false
      },
      exposures: {
        has_exposure_to_hazards: false,
        details: ''
      },
      prior_cancellations: {
        has_prior_cancellations: false,
        reason: ''
      },
      bankruptcy: {
        has_bankruptcy: false,
        details: ''
      }
    },
    nature_of_business: {
      business_type: '',
      date_business_started: '',
      description_primary_operations: ''
    },
    prior_carrier_information: {
      carrier_name: '',
      policy_number: '',
      effective_date: '',
      expiration_date: '',
      premium: 0
    },
    loss_history: {
      has_losses: false,
      claims: [],
      total_losses: 0
    }
  };
} 