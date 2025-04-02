# Memories.json Structure Guide

## Overview

This document outlines the structure of the memories.json API output, explaining each element's purpose, data type, and what it represents in the context of the system.

## Memories.json Skeleton

```json
{
  "company": {
    "json": {
      "company": {
        // Company information fields
      },
      "contacts": [
        // Contact information for individuals
      ],
      "facts": [
        // Knowledge graph nodes extracted from conversations
      ]
    },
    "md": "string", // Markdown representation of company data
    "phone_events": {
      "json": [
        // Phone call records and transcripts
      ],
      "md": "string" // Markdown representation of phone events
    }
  }
}
```

## Key Components Explanation

### 1. Company JSON Structure

```json
"company": {
  "id": "string", // Unique identifier for the company
  "tivly_lead_id": "number", // Lead ID in the Tivly system
  "tivly_lead_acquisition_channel": "string", // How the lead was acquired (e.g., "OFFLINE")
  "tivly_lead_cost": "string", // Cost of acquiring the lead (e.g., "100.00")
  "tivly_entry_date_time": "string", // Timestamp of lead entry
  "tatch_producer": "number", // Producer ID in the Tatch system
  "tivly_campaign": "string", // Marketing campaign identifier
  "company_name": "string", // Official business name
  "company_primary_phone": "string", // Main business contact number (can be null)
  "company_description": "string", // Brief description of business operations
  "company_naics_code": "number", // North American Industry Classification System code
  "company_sic_code": "number", // Standard Industrial Classification code
  "company_legal_entity_type": "string", // Legal structure of business (can be null)
  "company_website": "string", // Business website URL (can be null)
  "company_industry": "string", // Primary industry category
  "company_sub_industry": "string", // Specific industry subcategory
  "company_questionnaire": "string", // Completed questionnaire responses (can be null)
  "company_primary_email": "string", // Main business email address
  "company_timezone": "string", // Business operating timezone
  "company_street_address_1": "string", // Primary address line
  "company_street_address_2": "string", // Secondary address line (suite, unit, etc.)
  "company_city": "string", // City location
  "company_state": "string", // State/province
  "company_postal_code": "string", // Postal/ZIP code
  "insurance_types": ["string"], // Array of insurance types sought
  "insurance_type_questionnaire": "string", // Insurance-specific questionnaire (can be null)
  "tivly_notes": "string", // Notes from Tivly integration
  "company_annual_revenue_usd": "string", // Annual revenue figure
  "company_annual_payroll_usd": "string", // Annual payroll expenditure
  "company_sub_contractor_costs_usd": "string", // Subcontractor expenses
  "company_full_time_employees": "number", // Count of full-time staff
  "company_part_time_employees": "number", // Count of part-time staff (can be null)
  "company_years_in_business": "number", // Years of operation
  "created_at": "string", // Record creation timestamp
  "updated_at": "string", // Record last update timestamp
  "hubspot_record_id": "string", // External CRM identifier
  "tivly_call_transferred_to": "string", // Call transfer information
  "company_lifecycle_stage": "string", // Current stage in business lifecycle
  "company_status": "string", // Active status (can be null)
  "lead_type": "string", // Category of lead
  "zep_sync_status": "string", // Synchronization status
  "external_id": "string", // External system identifier
  "tivly_data": {
    // Additional data from Tivly
  },
  "is_testing_user": "boolean", // Flag for test accounts
  "number_of_upsell": "number", // Upsell opportunity count
  "intercom_id": "string", // Intercom integration ID
  "mixpanel_user_id": "string" // Mixpanel analytics ID
}
```

### 2. Contacts Structure

```json
"contacts": [
  {
    "id": "string", // Unique contact identifier
    "company_id": "number", // Associated company ID
    "contact_first_name": "string", // First name
    "contact_last_name": "string", // Last name
    "contact_primary_phone": "string", // Primary phone number
    "contact_primary_email": "string", // Primary email address
    "contact_years_of_owner_experience": "number", // Years of experience in ownership role
    "created_at": "string", // Record creation timestamp
    "updated_at": "string", // Record last update timestamp
    "hubspot_record_id": "string", // External CRM identifier
    "contact_status": "string", // Current status (can be null)
    "tatch_producer": "string", // Producer association
    "open_phone_synced": "boolean", // Phone system sync status
    "external_id": "string", // External system identifier
    "customer_portal_status": "string", // Portal access status
    "clerk_invitation": {
      // Authentication invitation data
    },
    "intercom_id": "string" // Intercom integration ID
  }
]
```

### 3. Facts Structure

```json
"facts": [
  {
    "uuid": "string", // Unique fact identifier
    "content": "string", // Natural language representation of the fact
    "fact": "string", // Structured representation of the fact
    "name": "string", // Relationship type (e.g., "HAS_FEDERAL_ID", "SPECIALIZES_IN")
    "source_node_name": "string", // Subject entity in the relationship
    "target_node_name": "string", // Object entity in the relationship
    "created_at": "string", // When the fact was created
    "expired_at": "string", // When the fact became invalid (can be null)
    "valid_at": "string", // When the fact became valid (can be null)
    "invalid_at": "string" // When the fact stopped being valid (can be null)
  }
]
```

### 4. Phone Events Structure

```json
"phone_events": [
  {
    "event": "string", // Event type (e.g., "call")
    "direction": "string", // Call direction ("incoming" or "outgoing")
    "content": "string", // Summarized content of the call
    "created_at": "string", // Timestamp of the call
    "metadata": {
      "id": "number", // Unique event ID
      "openphone_user_id": "number", // User ID in phone system
      "contact_id": "number", // Associated contact ID
      "company_id": "number", // Associated company ID
      "openphone_line_id": "number", // Phone line identifier
      "call_duration_seconds": "string", // Call length
      "call_direction": "string", // Call direction
      "call_transcript": "string", // Full conversation transcript
      "call_recording_uri": "string", // Link to audio recording
      "call_summary": "string", // AI-generated summary of the call
      "openphone_call_id": "string", // Phone system call ID
      "created_at": "string", // Record creation timestamp
      "call_recording_data": {
        // Details about the recording file
      },
      "completed_at": "string", // Call end timestamp
      "phone_provider": "string", // Service provider name
      "need_call_review": "boolean", // Flag for review requirement
      "call_source": "string", // Origin of the call
      "retell_phone_line_id": "string", // Additional line ID (can be null)
      "ai_call_data": {
        // AI analysis of the call (if applicable)
      },
      "ai_call_id": "string", // AI system call ID (can be null)
      "external_id": "string" // External system identifier
    }
  }
]
```

## How Each Component Is Used

1. **Company Data:** Contains official business information (name, address, industry codes) for form completion.

2. **Contacts:** Provides details about key individuals associated with the business for communication and relationship management.

3. **Facts:** These are knowledge graph nodes representing structured information extracted from conversations. They follow a subject-predicate-object format and include temporal validity information. These facts are particularly valuable for extracting specific data points mentioned in conversations but not stored in structured fields.

4. **Phone Events:** These capture the actual conversation data, including full transcripts and AI-generated summaries. They provide context and can be used to extract information that might not be explicitly captured in the structured data or facts.

This structure allows for a comprehensive view of the customer, combining structured business data with knowledge extracted from conversations, enabling accurate form pre-filling and intelligent customer service.