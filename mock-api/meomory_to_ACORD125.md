# Form Mapping Guide: Memories.json to ACORD 125

## Table of Contents
1. [Introduction](#introduction)
2. [Memories.json Structure](#memoriesjson-structure)
3. [ACORD 125 Schema](#acord-125-schema)
4. [Field Mapping](#field-mapping)
5. [Data Extraction Strategies](#data-extraction-strategies)
6. [Implementation Considerations](#implementation-considerations)

## Introduction

This document serves as a guide for mapping data from the `memories.json` file to fields in the ACORD 125 Commercial Insurance Application form. The goal is to create a comprehensive mapping that enables automatic pre-filling of the form with relevant information extracted from structured company data and unstructured call transcripts.

## Calling the Memories API for a company with id 7058:

```bash
curl -X POST --url "https://tatch.retool.com/url/memory-interview" --data '{"company_id":7058}' -H 'Content-Type: application/json' -H 'X-Workflow-Api-Key: retool_wk_dc0b4514fc4545d99d78175c985010bb'
```

## Memories.json Structure

The `memories.json` file contains three main sections:

### 1. Company JSON
Contains structured information about the company and its contacts:

```
company.json = {
  company: {
    id: string,
    company_name: string,
    company_primary_phone: string,
    company_description: string,
    company_naics_code: string,
    company_sic_code: string,
    company_legal_entity_type: string,
    company_website: string,
    company_industry: string,
    company_sub_industry: string,
    company_primary_email: string,
    company_timezone: string,
    company_street_address_1: string,
    company_street_address_2: string,
    company_city: string,
    company_state: string,
    company_postal_code: string,
    insurance_types: string[],
    company_annual_revenue_usd: string,
    company_annual_payroll_usd: string,
    company_sub_contractor_costs_usd: string,
    company_full_time_employees: number,
    company_part_time_employees: number,
    company_years_in_business: number
    ...
  },
  contacts: [
    {
      id: string,
      company_id: number,
      contact_first_name: string,
      contact_last_name: string,
      contact_primary_phone: string,
      contact_primary_email: string,
      contact_years_of_owner_experience: number
      ...
    }
  ]
}
```

### 2. Facts
Contains structured knowledge graph nodes extracted from call transcripts:

```
facts = [
  {
    uuid: string,
    content: string,
    fact: string,
    name: string,
    source_node_name: string,
    target_node_name: string,
    created_at: string,
    expired_at: string | null,
    valid_at: string | null,
    invalid_at: string | null
  }
]
```

Facts represent relationships between entities, with the following key components:
- `content`: The fact in natural language
- `name`: The type of relationship (e.g., HAS_FEDERAL_ID, SPECIALIZES_IN)
- `source_node_name` and `target_node_name`: The entities involved in the relationship
- `valid_at` and `invalid_at`: Timestamps for when the fact is valid

### 3. Phone Events
Contains raw transcripts of phone conversations:

```
phone_events = [
  {
    event: string,
    direction: string,
    content: string,
    created_at: string,
    metadata: {
      call_transcript: string,
      call_summary: string
      ...
    }
  }
]
```

Each phone event includes:
- `content`: A summarized version of the call
- `metadata.call_transcript`: The full transcript
- `metadata.call_summary`: A summary of the call

## ACORD 125 Schema

The ACORD 125 form has the following main sections and fields:

### Header Information
```json
{
  "date": "",
  "agency": {
    "name": "",
    "contact_name": "",
    "phone": "",
    "fax": "",
    "email": "",
    "agency_customer_id": ""
  },
  "carrier": {
    "name": "",
    "naic_code": "",
    "policy_number": ""
  },
  "status_of_transaction": {
    "transaction_type": ""
  }
}
```

### Policy Information
```json
{
  "proposed_eff_date": "",
  "proposed_exp_date": "",
  "billing_plan": "",
  "payment_plan": "",
  "policy_premium": 0
}
```

### Applicant Information
```json
{
  "named_insured": {
    "name": "",
    "mailing_address": {
      "street_address": "",
      "city": "",
      "state": "",
      "zip": ""
    },
    "gl_code": "",
    "sic": "",
    "naics": "",
    "fein_or_soc_sec": "",
    "business_phone": "",
    "website_address": "",
    "entity_type": ""
  }
}
```

### Contact Information
```json
{
  "contact_name": "",
  "primary_phone": "",
  "primary_email": ""
}
```

### Premises Information
```json
{
  "location": {
    "street": "",
    "city": "",
    "state": "",
    "zip": "",
    "interest": "",
    "full_time_employees": 0,
    "part_time_employees": 0,
    "annual_revenues": 0,
    "description_of_operations": ""
  }
}
```

### General Information
```json
{
  "has_subsidiaries": false,
  "safety_program": {
    "has_program": false,
    "safety_manual": false,
    "monthly_meetings": false
  },
  "exposures": {
    "has_exposure_to_hazards": false,
    "details": ""
  },
  "prior_cancellations": {
    "has_prior_cancellations": false,
    "reason": ""
  },
  "bankruptcy": {
    "has_bankruptcy": false,
    "details": ""
  }
}
```

### Nature of Business
```json
{
  "business_type": "",
  "date_business_started": "",
  "description_primary_operations": ""
}
```

### Prior Carrier Information
```json
{
  "carrier_name": "",
  "policy_number": "",
  "effective_date": "",
  "expiration_date": "",
  "premium": 0
}
```

### Loss History
```json
{
  "has_losses": false,
  "claims": [
    {
      "date_of_occurrence": "",
      "description": "",
      "amount_paid": 0,
      "amount_reserved": 0,
      "status": ""
    }
  ],
  "total_losses": 0
}
```

## Field Mapping

Below is a detailed mapping between `memories.json` fields and ACORD 125 fields:

### Applicant Information

| ACORD 125 Field | memories.json Field | Notes |
|-----------------|---------------------|-------|
| `named_insured.name` | `company.json.company.company_name` | "Bangor Abatement, Inc." |
| `named_insured.mailing_address.street_address` | `company.json.company.company_street_address_1` + `company.json.company.company_street_address_2` | "17 Doughty Drive, Suit 211" |
| `named_insured.mailing_address.city` | `company.json.company.company_city` | "Brewer" |
| `named_insured.mailing_address.state` | `company.json.company.company_state` | "Maine" |
| `named_insured.mailing_address.zip` | `company.json.company.company_postal_code` | "04412" |
| `named_insured.business_phone` | `company.json.contacts[0].contact_primary_phone` | "+12075731844" |
| `named_insured.sic` | `company.json.company.company_sic_code` | "1799" |
| `named_insured.naics` | `company.json.company.company_naics_code` | "562910" |
| `named_insured.fein_or_soc_sec` | Facts with name "HAS_FEDERAL_ID" | "01 024112" |
| `named_insured.website_address` | `company.json.company.company_website` | null in the data |
| `named_insured.entity_type` | `company.json.company.company_legal_entity_type` | Needs inference if null |

### Contact Information

| ACORD 125 Field | memories.json Field | Notes |
|-----------------|---------------------|-------|
| `contact_name` | `company.json.contacts[0].contact_first_name` + `company.json.contacts[0].contact_last_name` | "Kenneth Mccue" |
| `primary_phone` | `company.json.contacts[0].contact_primary_phone` | "+12075731844" |
| `primary_email` | `company.json.contacts[0].contact_primary_email` | "bangorabatement@gmail.com" |

### Nature of Business

| ACORD 125 Field | memories.json Field | Notes |
|-----------------|---------------------|-------|
| `business_type` | `company.json.company.company_industry` | "Construction & Contractors" |
| `date_business_started` | Calculate from `company.json.company.company_years_in_business` | 4 years before current date |
| `description_primary_operations` | `company.json.company.company_description` + `company.json.company.company_sub_industry` | "general constructor asbestos remediation" + "Asbestos Abatement" |

### Premises Information

| ACORD 125 Field | memories.json Field | Notes |
|-----------------|---------------------|-------|
| `location.street` | `company.json.company.company_street_address_1` | "17 Doughty Drive" |
| `location.city` | `company.json.company.company_city` | "Brewer" |
| `location.state` | `company.json.company.company_state` | "Maine" |
| `location.zip` | `company.json.company.company_postal_code` | "04412" |
| `location.full_time_employees` | `company.json.company.company_full_time_employees` | 6 |
| `location.part_time_employees` | `company.json.company.company_part_time_employees` | null in the data |
| `location.annual_revenues` | `company.json.company.company_annual_revenue_usd` | "750000.00" |

### General Information

| ACORD 125 Field | memories.json Field | Notes |
|-----------------|---------------------|-------|
| `safety_program.has_program` | Facts with name "SAFETY_MEETINGS_FREQUENCY" | true |
| `safety_program.monthly_meetings` | Facts with name "SAFETY_MEETINGS_FREQUENCY" | true if target_node_name is "monthly" |
| `exposures.has_exposure_to_hazards` | Facts with name "NOT_ALLOWED_TO_HAVE" where target_node_name includes "flammables", "explosives", "chemicals" | false |
| `bankruptcy.has_bankruptcy` | Facts with name "HAS_BANKRUPTCIES" | false |

### Prior Carrier Information

| ACORD 125 Field | memories.json Field | Notes |
|-----------------|---------------------|-------|
| `carrier_name` | Phone events mentioning carrier | Look for mentions in call transcripts |
| `premium` | Facts with name "IS_NOW_INSURANCE_RATE" | "$25K annually" |
| `effective_date` | Facts or phone events about policy expiration | Calculate based on "February 1st" expiration date |

### Loss History

| ACORD 125 Field | memories.json Field | Notes |
|-----------------|---------------------|-------|
| `has_losses` | Facts with name "FILED" | true |
| `claims[0].date_of_occurrence` | Facts with name "HISTORICAL_CLAIM" | "2017" |
| `claims[0].description` | Facts with name "HISTORICAL_CLAIM" | "fall incident at a rest area" |
| `claims[0].amount_paid` | Facts with name "ESTIMATED_LOSS_AMOUNT" | "$80,000" |
| `claims[0].status` | Facts with name "HAS_OPEN_CLAIM" | "open" |

## Data Extraction Strategies

To effectively extract information from the `memories.json` file, consider the following strategies:

### 1. Direct Field Mapping

For structured data in `company.json`:
```javascript
function extractDirectFields(companyData) {
  const company = companyData.company;
  const contact = companyData.contacts[0];
  
  return {
    named_insured: {
      name: company.company_name,
      mailing_address: {
        street_address: [company.company_street_address_1, company.company_street_address_2].filter(Boolean).join(', '),
        city: company.company_city,
        state: company.company_state,
        zip: company.company_postal_code
      },
      business_phone: contact?.contact_primary_phone || company.company_primary_phone,
      sic: company.company_sic_code,
      naics: company.company_naics_code,
      website_address: company.company_website
    },
    // ... other direct mappings
  };
}
```

### 2. Fact-Based Extraction

For information stored in facts:
```javascript
function extractFactBasedFields(facts) {
  const fieldsToExtract = {
    fein_or_soc_sec: {
      factName: "HAS_FEDERAL_ID",
      extractionMethod: (fact) => {
        // Extract Federal ID from fact content
        const match = fact.content.match(/Federal ID number: (\d+\s+\d+)/);
        return match ? match[1] : null;
      }
    },
    // ... other fact-based extractions
  };
  
  const extractedFields = {};
  
  for (const [fieldName, config] of Object.entries(fieldsToExtract)) {
    const relevantFacts = facts.filter(fact => 
      fact.name === config.factName && 
      (!fact.invalid_at || new Date(fact.invalid_at) > new Date())
    );
    
    // Sort by validity date to get the most recent valid fact
    relevantFacts.sort((a, b) => new Date(b.valid_at || 0) - new Date(a.valid_at || 0));
    
    if (relevantFacts.length > 0) {
      extractedFields[fieldName] = config.extractionMethod(relevantFacts[0]);
    }
  }
  
  return extractedFields;
}
```

### 3. Phone Event Extraction

For information found in call transcripts:
```javascript
function extractFromPhoneEvents(phoneEvents) {
  const fieldExtractors = {
    'policy_expiration': (transcript) => {
      const match = transcript.match(/insurance policy expire.*?(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d+)/i);
      if (match) {
        return { month: match[1], day: match[2] };
      }
      return null;
    },
    // ... other transcript-based extractions
  };
  
  const extractedFields = {};
  
  for (const [fieldName, extractor] of Object.entries(fieldExtractors)) {
    for (const event of phoneEvents) {
      const transcript = event.metadata?.call_transcript || event.content;
      const extracted = extractor(transcript);
      if (extracted) {
        extractedFields[fieldName] = extracted;
        break;
      }
    }
  }
  
  return extractedFields;
}
```

### 4. AI-Assisted Extraction

For complex or ambiguous information:
```javascript
async function aiAssistedExtraction(memories) {
  const prompt = `
  You are an AI assistant tasked with extracting information from company data to fill an ACORD 125 insurance form.
  
  Company data:
  ${JSON.stringify(memories, null, 2)}
  
  Please extract the following information in JSON format:
  1. Business legal entity type (Corporation, LLC, etc.)
  2. Whether the company has any subsidiaries
  3. Whether there are any uncorrected fire/safety violations
  4. Any additional important information for an insurance application
  `;
  
  const response = await callAI(prompt);
  return JSON.parse(response);
}
```

## Implementation Considerations

### 1. Data Quality and Verification

- **Timestamp-Based Selection**: When multiple facts provide the same information, use `valid_at` and `invalid_at` timestamps to select the most recent valid fact.
- **Confidence Scoring**: Implement a confidence score for each extracted field, especially those from unstructured sources.
- **Manual Verification**: Highlight fields with low confidence for manual verification by users.

### 2. Conflict Resolution

When conflicts arise between different data sources:

1. **Prioritization**: Generally prioritize in this order:
   - Direct company.json fields (highest confidence)
   - Facts with valid timestamps
   - Phone events (lowest confidence)

2. **Multiple Values**: For fields that could have multiple values (e.g., insurance types), collect all unique values.

### 3. Default Values and Inferences

For missing information, implement reasonable defaults or inferences:

- **Business Entity Type**: If not specified, infer based on industry standards (e.g., construction companies are often Corporations or LLCs).
- **Dates**: Calculate dates based on available information (e.g., start date from years in business).
- **Boolean Fields**: Default to false for safety-related questions when no information is available.

### 4. Handling Special Cases

- **Name Variations**: Handle variations in person names (e.g., "Kenneth Mccue" vs. "Kenneth Mako").
- **Multiple Businesses**: Handle the relationship between the main business (Bangor Abatement Inc.) and related entities (BA Management LLC).
- **Expired Facts**: Consider the context when a fact has been marked as expired or invalid.

This mapping guide provides a comprehensive framework for extracting and organizing data from the `memories.json` file to pre-fill the ACORD 125 form, enabling the development of an effective form generation application.