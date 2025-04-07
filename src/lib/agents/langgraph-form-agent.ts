/**
 * Harper Form Processing Agent
 * A sophisticated form-processing agent built with LangGraph for handling insurance form conversations.
 */

import { OpenAI } from "@langchain/openai";
import { 
  StateGraph,
  END
} from "@langchain/langgraph";
import { 
  FunctionMessage, 
  HumanMessage, 
  AIMessage, 
  SystemMessage 
} from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { InsuranceForm } from "@/types";

/**
 * Initialize OpenAI models with appropriate parameters
 */
const llm = new OpenAI({
  modelName: "gpt-4o-mini", // Using mini for faster responses, can upgrade if needed
  temperature: 0.1,         // Low temperature for deterministic responses on factual tasks
  openAIApiKey: process.env.OPENAI_API_KEY || "",
});

const chatLLM = new OpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.7,         // Higher temperature for more natural conversation
  openAIApiKey: process.env.OPENAI_API_KEY || "",
});

/**
 * Field metadata system for handling information about form fields,
 * their relationships, validation rules, and descriptions.
 */
interface FieldMetadata {
  description: string;
  examples: string[];
  validationRules?: string;
  relatedFields?: string[];
  section: string;
  ambiguityResolutionHints?: string[];
}

// Insurance form field metadata repository
const fieldMetadata: Record<keyof InsuranceForm, FieldMetadata> = {
  companyName: {
    description: "The legal name of the company applying for insurance coverage",
    examples: ["Acme Corporation", "Smith & Sons LLC"],
    section: "company"
  },
  address: {
    description: "The street address of the company's primary location",
    examples: ["123 Main Street", "456 Business Ave, Suite 100"],
    section: "premises",
    ambiguityResolutionHints: ["location", "building", "property", "office", "premises"]
  },
  city: {
    description: "The city where the company's primary location is situated",
    examples: ["San Francisco", "New York"],
    section: "premises",
    ambiguityResolutionHints: ["location", "property", "premises"]
  },
  state: {
    description: "The state where the company's primary location is situated",
    examples: ["CA", "NY", "TX"],
    section: "premises",
    ambiguityResolutionHints: ["location", "property", "premises"]
  },
  zipCode: {
    description: "The ZIP code of the company's primary location",
    examples: ["94105", "10001"],
    validationRules: "5-digit or 9-digit ZIP code (XXXXX or XXXXX-XXXX)",
    section: "premises",
    ambiguityResolutionHints: ["location", "property", "premises"]
  },
  industry: {
    description: "The primary industry in which the company operates",
    examples: ["Technology", "Manufacturing", "Healthcare"],
    section: "company"
  },
  employeeCount: {
    description: "The total number of employees working for the company",
    examples: ["15", "250", "1000+"],
    section: "company"
  },
  annualRevenue: {
    description: "The company's annual revenue in USD",
    examples: ["$500,000", "$2,500,000", "$10,000,000+"],
    section: "financial"
  },
  yearFounded: {
    description: "The year the company was established",
    examples: ["1995", "2010", "2023"],
    section: "company"
  },
  deductibleAmount: {
    description: "The amount the policyholder must pay out-of-pocket before insurance coverage begins",
    examples: ["$1,000", "$5,000", "$10,000"],
    section: "coverage"
  },
  coverageLimit: {
    description: "The maximum amount the insurance will pay for covered losses",
    examples: ["$1,000,000", "$5,000,000"],
    section: "coverage"
  },
  effectiveDate: {
    description: "The date when the insurance coverage begins",
    examples: ["2023-01-01", "2024-07-15"],
    validationRules: "YYYY-MM-DD format",
    section: "coverage"
  },
  expirationDate: {
    description: "The date when the insurance coverage ends",
    examples: ["2024-01-01", "2025-07-15"],
    validationRules: "YYYY-MM-DD format",
    section: "coverage",
    relatedFields: ["effectiveDate"]
  },
  premiumAmount: {
    description: "The amount paid for the insurance coverage",
    examples: ["$2,500", "$10,000"],
    section: "financial"
  },
  contactName: {
    description: "Name of the primary contact person for the insurance policy",
    examples: ["John Smith", "Jane Doe"],
    section: "contact"
  },
  contactEmail: {
    description: "Email address of the primary contact person",
    examples: ["john.smith@acme.com", "jane.doe@example.com"],
    validationRules: "Valid email format (example@domain.com)",
    section: "contact"
  },
  contactPhone: {
    description: "Phone number of the primary contact person",
    examples: ["(555) 123-4567", "555-123-4567"],
    validationRules: "10-digit US phone number, various formats accepted",
    section: "contact"
  },
  additionalNotes: {
    description: "Any additional information relevant to the insurance application",
    examples: ["Building has sprinkler system installed", "Business operates 24/7"],
    section: "other"
  }
};

/**
 * Group fields by section for better organization and ambiguity resolution
 */
const fieldsBySection: Record<string, (keyof InsuranceForm)[]> = {
  company: ["companyName", "industry", "employeeCount", "yearFounded"],
  premises: ["address", "city", "state", "zipCode"],
  contact: ["contactName", "contactEmail", "contactPhone"],
  coverage: ["deductibleAmount", "coverageLimit", "effectiveDate", "expirationDate"],
  financial: ["annualRevenue", "premiumAmount"],
  other: ["additionalNotes"]
};

/**
 * Comprehensive state definition for the agent
 */
interface FormAgentState {
  // Conversation state
  messages: Array<HumanMessage | AIMessage | FunctionMessage | SystemMessage>;
  currentFormData: InsuranceForm;
  
  // Processing state
  intent?: {
    primaryIntent: string;
    targetFields: string[];
    ambiguousFields: string[];
    values: Record<string, any>;
    confidenceScore: number;
    reasoning: string;
  };
  
  // Field extraction and updates
  fieldUpdates?: Record<string, any>;
  extractionReasoning?: string;
  
  // Ambiguity resolution
  ambiguityContext?: {
    field: string;
    possibleSections: string[];
    resolved: boolean;
    resolvedSection?: string;
  };
  
  // Conversation focus
  currentSection?: string;
  focusedFields?: string[];
  
  // Response generation
  explanation?: string;
  
  // Metadata
  companyId?: string;
  debug?: boolean;
  conversationId?: string;
}

/**
 * Type Guard: Check if a message is a HumanMessage
 */
function isHumanMessage(message: any): message is HumanMessage {
  return message instanceof HumanMessage;
}

/**
 * PROCESS NODES
 * These nodes implement the core processing logic for our agent
 */

/**
 * Intent Classification Node
 * Determines what the user is trying to accomplish with their message
 */
async function classifyIntent(state: FormAgentState): Promise<FormAgentState> {
  if (state.debug) {
    console.log("HarperAgent - Intent Classification started");
  }

  // Get the last message from the user
  const lastMessage = state.messages[state.messages.length - 1];
  if (!isHumanMessage(lastMessage)) {
    return state;
  }

  const userMessage = lastMessage.content as string;
  
  // Create a prompt for intent classification
  const intentPrompt = ChatPromptTemplate.fromTemplate(`
    You are an expert insurance agent specializing in form processing.
    
    Current form data:
    {form_data}
    
    User message: "{user_message}"
    
    Classify the user's intent into ONE of the following categories:
    1. UPDATE_FORM: User wants to update a specific field in the form
    2. FIELD_QUESTION: User is asking about a specific field (what it means, how to fill it)
    3. GENERAL_QUESTION: User is asking a general question about insurance
    4. FORM_NAVIGATION: User wants to navigate to a different section of the form
    5. GUIDANCE: User is asking for guidance on completing the form
    6. CONFIRMATION: User is confirming or acknowledging information
    7. GREETING: User is greeting or starting a conversation
    8. OTHER: Another intent not covered above
    
    For UPDATE_FORM, also identify:
    - The specific field(s) they want to update
    - If there's any ambiguity (e.g., "zipCode" could refer to applicant's address or premises)
    - The value they want to set
    
    For FIELD_QUESTION, identify which field(s) they're asking about.
    
    For FORM_NAVIGATION, identify which section they want to navigate to.
    
    Return a JSON object with the following structure:
    {
      "primaryIntent": "one of the categories above",
      "targetFields": ["field1", "field2"],
      "ambiguousFields": ["ambiguousField1"],
      "values": {"field1": "value1"},
      "confidenceScore": 0.95,
      "reasoning": "brief explanation of the classification"
    }
  `);

  const jsonParser = new JsonOutputParser();
  
  const chain = RunnableSequence.from([
    intentPrompt,
    llm,
    jsonParser
  ]);
  
  try {
    const intent = await chain.invoke({
      form_data: JSON.stringify(state.currentFormData, null, 2),
      user_message: userMessage
    });
    
    if (state.debug) {
      console.log("HarperAgent - Intent classification result:", intent);
    }
    
    // Determine current section based on the fields mentioned
    let currentSection = state.currentSection;
    if (intent.targetFields && intent.targetFields.length > 0) {
      const field = intent.targetFields[0] as keyof InsuranceForm;
      if (fieldMetadata[field]) {
        currentSection = fieldMetadata[field].section;
      }
    }
    
    return {
      ...state,
      intent,
      currentSection,
      focusedFields: intent.targetFields
    };
  } catch (error) {
    console.error("Error in intent classification:", error);
    return {
      ...state,
      intent: {
        primaryIntent: "OTHER",
        targetFields: [],
        ambiguousFields: [],
        values: {},
        confidenceScore: 0.5,
        reasoning: "Failed to classify intent due to an error"
      }
    };
  }
}

/**
 * Ambiguity Detection and Resolution Node
 * Identifies and resolves ambiguous field references
 */
async function resolveAmbiguities(state: FormAgentState): Promise<FormAgentState> {
  if (!state.intent || !state.intent.ambiguousFields || state.intent.ambiguousFields.length === 0) {
    return state; // No ambiguities to resolve
  }
  
  if (state.debug) {
    console.log("HarperAgent - Ambiguity resolution started");
  }
  
  const ambiguousField = state.intent.ambiguousFields[0];
  const lastMessage = state.messages[state.messages.length - 1];
  
  if (!isHumanMessage(lastMessage)) {
    return state;
  }
  
  const userMessage = lastMessage.content as string;
  
  // Create a prompt to resolve ambiguities
  const resolvePrompt = ChatPromptTemplate.fromTemplate(`
    You are an expert at resolving ambiguities in insurance form references.
    
    Current form data:
    {form_data}
    
    User message: "{user_message}"
    
    The user is referring to an ambiguous field: "{ambiguous_field}"
    
    This field could belong to different sections:
    {possible_sections}
    
    Current conversation section: {current_section}
    
    Based on the context, determine which section the user is most likely referring to.
    Consider:
    1. Words in the message that suggest a specific section
    2. The section they were previously discussing
    3. Related fields mentioned in the same message
    4. Common patterns in insurance form completion
    
    Return a JSON object with the following structure:
    {
      "resolvedSection": "the section name",
      "confidence": 0.8,
      "reasoning": "brief explanation of why you chose this section"
    }
  `);

  const jsonParser = new JsonOutputParser();
  
  // Find possible sections for this field
  const possibleSections: string[] = [];
  Object.entries(fieldsBySection).forEach(([section, fields]) => {
    if (fields.includes(ambiguousField as keyof InsuranceForm)) {
      possibleSections.push(section);
    }
  });
  
  // If there's only one possible section, it's not truly ambiguous
  if (possibleSections.length <= 1) {
    return {
      ...state,
      ambiguityContext: {
        field: ambiguousField,
        possibleSections,
        resolved: true,
        resolvedSection: possibleSections[0]
      }
    };
  }
  
  const chain = RunnableSequence.from([
    resolvePrompt,
    llm,
    jsonParser
  ]);
  
  try {
    const resolution = await chain.invoke({
      form_data: JSON.stringify(state.currentFormData, null, 2),
      user_message: userMessage,
      ambiguous_field: ambiguousField,
      possible_sections: possibleSections.map(section => 
        `${section}: ${fieldsBySection[section].join(', ')}`
      ).join('\n'),
      current_section: state.currentSection || "unknown"
    });
    
    if (state.debug) {
      console.log("HarperAgent - Ambiguity resolution result:", resolution);
    }
    
    // If we have high confidence, consider it resolved
    const resolved = resolution.confidence > 0.7;
    
    return {
      ...state,
      ambiguityContext: {
        field: ambiguousField,
        possibleSections,
        resolved,
        resolvedSection: resolution.resolvedSection
      },
      // Update current section if we've resolved the ambiguity with high confidence
      currentSection: resolved ? resolution.resolvedSection : state.currentSection
    };
  } catch (error) {
    console.error("Error in ambiguity resolution:", error);
    return {
      ...state,
      ambiguityContext: {
        field: ambiguousField,
        possibleSections,
        resolved: false
      }
    };
  }
}

/**
 * Field Extraction Node
 * Extracts field updates from user messages
 */
async function extractFieldUpdates(state: FormAgentState): Promise<FormAgentState> {
  if (state.intent?.primaryIntent !== "UPDATE_FORM") {
    return { ...state, fieldUpdates: {} };
  }
  
  if (state.debug) {
    console.log("HarperAgent - Field extraction started");
  }
  
  const lastMessage = state.messages[state.messages.length - 1];
  if (!isHumanMessage(lastMessage)) {
    return { ...state, fieldUpdates: {} };
  }

  const userMessage = lastMessage.content as string;
  
  // If we have unresolved ambiguities and need clarification
  if (state.ambiguityContext && !state.ambiguityContext.resolved) {
    return { 
      ...state, 
      fieldUpdates: {},
      explanation: `I noticed you're updating a field, but I'm not sure if you're referring to the ${state.ambiguityContext.possibleSections.join(' or ')} section. Could you please clarify?`
    };
  }
  
  // Include ambiguity context in the prompt if available
  const ambiguityInfo = state.ambiguityContext && state.ambiguityContext.resolved
    ? `The user referred to an ambiguous field "${state.ambiguityContext.field}" which has been resolved to the "${state.ambiguityContext.resolvedSection}" section.`
    : '';
  
  const extractionPrompt = ChatPromptTemplate.fromTemplate(`
    You are an expert insurance agent assistant specializing in form completion.
    
    Current form data:
    {form_data}
    
    User message: "{user_message}"
    
    Previous intent classification:
    {intent_classification}
    
    Current form section: {current_section}
    
    {ambiguity_info}
    
    Extract the specific fields and values that need to be updated in the form.
    Ensure the field names exactly match one of the valid fields in the form.
    For each field, extract the precise value the user wants to set.
    
    Return a JSON object with the following structure:
    {
      "updates": {
        "fieldName1": "value1",
        "fieldName2": "value2"
      },
      "reasoning": "explanation of how you determined these fields and values"
    }
    
    NOTE: Only include fields in the following list:
    - companyName (string)
    - address (string)
    - city (string)
    - state (string)
    - zipCode (string)
    - industry (string)
    - employeeCount (number)
    - annualRevenue (number)
    - yearFounded (number)
    - deductibleAmount (number)
    - coverageLimit (number)
    - effectiveDate (string, YYYY-MM-DD format)
    - expirationDate (string, YYYY-MM-DD format)
    - premiumAmount (number)
    - contactName (string)
    - contactEmail (string)
    - contactPhone (string)
    - additionalNotes (string)
    
    For numeric fields, convert values to numbers.
    For dates, use YYYY-MM-DD format.
  `);
  
  const jsonParser = new JsonOutputParser();
  const chain = RunnableSequence.from([
    extractionPrompt,
    llm,
    jsonParser
  ]);
  
  try {
    const result = await chain.invoke({
      form_data: JSON.stringify(state.currentFormData, null, 2),
      user_message: userMessage,
      intent_classification: JSON.stringify(state.intent, null, 2),
      current_section: state.currentSection || "unknown",
      ambiguity_info: ambiguityInfo
    });
    
    // Validate and normalize field values
    const updates = { ...result.updates };
    Object.entries(updates).forEach(([key, value]) => {
      const field = key as keyof InsuranceForm;
      
      // Convert numeric string values to actual numbers
      if (['employeeCount', 'annualRevenue', 'yearFounded', 'deductibleAmount', 
           'coverageLimit', 'premiumAmount'].includes(field) && 
          typeof value === 'string') {
        const numericValue = Number(value);
        if (!isNaN(numericValue)) {
          updates[field] = numericValue;
        }
      }
      
      // Normalize date formats
      if (['effectiveDate', 'expirationDate'].includes(field) && typeof value === 'string') {
        // Check if date is in correct format, if not try to normalize it
        if (!value.match(/^\d{4}-\d{2}-\d{2}$/)) {
          try {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              updates[field] = date.toISOString().split('T')[0]; // YYYY-MM-DD format
            }
          } catch (e) {
            // Keep original value if transformation fails
          }
        }
      }
    });
    
    if (state.debug) {
      console.log("HarperAgent - Extraction result:", result);
      console.log("HarperAgent - Normalized updates:", updates);
    }
    
    return {
      ...state,
      fieldUpdates: updates,
      extractionReasoning: result.reasoning
    };
  } catch (error) {
    console.error("Error extracting field updates:", error);
    return {
      ...state,
      fieldUpdates: {},
      extractionReasoning: "Failed to extract updates due to an error"
    };
  }
}

/**
 * Field Information Node
 * Provides information about form fields when users ask questions
 */
async function provideFieldInformation(state: FormAgentState): Promise<FormAgentState> {
  if (state.intent?.primaryIntent !== "FIELD_QUESTION") {
    return state;
  }
  
  if (state.debug) {
    console.log("HarperAgent - Field information requested");
  }
  
  // No fields identified in the question
  if (!state.intent.targetFields || state.intent.targetFields.length === 0) {
    return {
      ...state,
      explanation: "I'd be happy to provide information about any field in the form. Which specific field would you like to know more about?"
    };
  }
  
  const targetField = state.intent.targetFields[0] as keyof InsuranceForm;
  const metadata = fieldMetadata[targetField];
  
  if (!metadata) {
    return {
      ...state,
      explanation: `I don't have information about a field called "${targetField}". Could you please specify which field you're asking about?`
    };
  }
  
  // Generate field information response
  const response = `
The "${formatFieldName(targetField)}" field ${metadata.description}.

${metadata.validationRules ? `This field should be in the format: ${metadata.validationRules}.` : ''}

Examples: ${metadata.examples.join(', ')}

${metadata.relatedFields && metadata.relatedFields.length > 0 ? 
  `This field is related to: ${metadata.relatedFields.map(f => formatFieldName(f)).join(', ')}.` : ''}

${targetField === 'zipCode' ? 'The ZIP code helps determine insurance rates based on location risk factors.' : ''}
${targetField === 'industry' ? 'Your industry classification affects the risk assessment and premium calculation.' : ''}
${targetField === 'employeeCount' ? 'The number of employees impacts liability coverage requirements.' : ''}
`.trim();

  return {
    ...state,
    explanation: response,
    currentSection: metadata.section
  };
}

/**
 * Response Generation Node
 * Creates natural language responses to user messages
 */
async function generateResponse(state: FormAgentState): Promise<FormAgentState> {
  // If we already have an explanation (like from ambiguity resolution), use it
  if (state.explanation) {
    return state;
  }
  
  if (state.debug) {
    console.log("HarperAgent - Response generation started");
  }

  // If we have field updates, generate an update confirmation
  if (state.intent?.primaryIntent === "UPDATE_FORM" && 
      state.fieldUpdates && 
      Object.keys(state.fieldUpdates).length > 0) {
    
    const explanation = generateUpdateExplanation(state.fieldUpdates, state.extractionReasoning);
    
    return {
      ...state,
      explanation
    };
  }
  
  // For intents other than field questions and updates, generate a conversational response
  if (state.intent?.primaryIntent !== "FIELD_QUESTION") {
    const lastMessage = state.messages[state.messages.length - 1];
    if (!isHumanMessage(lastMessage)) {
      return { 
        ...state, 
        explanation: "I'd be happy to help with your insurance form. What would you like to know or update?" 
      };
    }

    const userMessage = lastMessage.content as string;
    
    const responsePrompt = ChatPromptTemplate.fromTemplate(`
      You are Harper, a friendly and professional insurance agent assistant.
      
      Current form data:
      {form_data}
      
      User message: "{user_message}"
      
      Intent classification:
      {intent_classification}
      
      Current form section: {current_section}
      
      Generate a helpful, conversational response that addresses the user's intent.
      
      Guidelines:
      - Use a warm, friendly, and professional tone
      - Respond as an insurance professional would
      - Be concise but informative
      - If the user is asking about insurance concepts, provide accurate information
      - If they're asking about the form, reference relevant information from the current form data
      - NEVER mention that you're an AI or language model
      - DO NOT use phrases like "I've processed your request" or "I understand your intent"
      - Don't apologize for not finding updates if there were none - instead, be helpful
      
      Maximum response length: 3 sentences.
    `);
    
    try {
      const response = await chatLLM.invoke([
        new SystemMessage(await responsePrompt.format({
          form_data: JSON.stringify(state.currentFormData, null, 2),
          user_message: userMessage,
          intent_classification: JSON.stringify(state.intent, null, 2),
          current_section: state.currentSection || "unknown"
        }))
      ]);
      
      return {
        ...state,
        explanation: response.content
      };
    } catch (error) {
      console.error("Error generating conversational response:", error);
      return {
        ...state,
        explanation: "I'd be happy to help with your insurance form. What would you like to know or update?"
      };
    }
  }
  
  // We shouldn't reach here because field questions are handled by provideFieldInformation
  return state;
}

/**
 * HELPER FUNCTIONS
 * Utility functions that support the main processing nodes
 */

/**
 * Generate a natural language explanation for form updates
 */
function generateUpdateExplanation(updates: Record<string, any>, reasoning?: string): string {
  const fieldNames = Object.keys(updates);
  
  if (fieldNames.length === 0) {
    return "I don't see any specific fields to update. Could you please clarify what information you'd like to change?";
  }
  
  // Format values for display
  const formattedValues = fieldNames.map(field => {
    const value = updates[field];
    
    // Format based on field type
    if (['employeeCount', 'annualRevenue', 'yearFounded', 'deductibleAmount', 
         'coverageLimit', 'premiumAmount'].includes(field)) {
      return `${formatFieldName(field)}: ${formatNumber(value, field)}`;
    } else if (['effectiveDate', 'expirationDate'].includes(field)) {
      return `${formatFieldName(field)}: ${formatDate(value)}`;
    } else {
      return `${formatFieldName(field)}: ${value}`;
    }
  });
  
  // Generate a more conversational and professional response
  if (fieldNames.length === 1) {
    return `Perfect! I've updated the ${formatFieldName(fieldNames[0])} to ${updates[fieldNames[0]]}. Is there anything else you'd like to change?`;
  } else {
    return `Great! I've updated the following information:\n- ${formattedValues.join('\n- ')}\n\nIs there anything else you'd like to update?`;
  }
}

/**
 * Format camelCase field names to display format
 */
function formatFieldName(field: string): string {
  // Convert camelCase to space-separated words
  return field
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
}

/**
 * Format number values for display
 */
function formatNumber(value: number, field: string): string {
  // Format currency values with $ and commas
  if (['annualRevenue', 'deductibleAmount', 'coverageLimit', 'premiumAmount'].includes(field)) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }
  // Format other numbers with commas
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Format date values for display
 */
function formatDate(dateStr: string): string {
  // Try to format the date in a more readable format
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
  } catch (e) {
    return dateStr; // Return original if parsing fails
  }
}

/**
 * WORKFLOW DEFINITION
 * Define the agent's state graph with nodes and transitions
 */

/**
 * Router function to determine next steps based on intent
 */
function router(state: FormAgentState): string {
  if (!state.intent) {
    return "error";
  }

  const intent = state.intent.primaryIntent;
  
  if (intent === "UPDATE_FORM") {
    // If we have ambiguous fields, go to ambiguity resolution
    if (state.intent.ambiguousFields && state.intent.ambiguousFields.length > 0) {
      return "resolve_ambiguities";
    }
    // Otherwise, proceed to extract field updates
    return "extract_field_updates";
  } else if (intent === "FIELD_QUESTION") {
    return "provide_field_information";
  } else {
    // For all other intents, go straight to response generation
    return "generate_response";
  }
}

/**
 * Create the LangGraph workflow
 */
export function buildFormAgentGraph() {
  // Create a new state graph with appropriate channels
  const workflow = new StateGraph<FormAgentState>({
    channels: {
      messages: { value: [] },
      currentFormData: { value: {} as InsuranceForm },
      intent: { value: undefined },
      fieldUpdates: { value: undefined },
      ambiguityContext: { value: undefined },
      explanation: { value: undefined },
      extractionReasoning: { value: undefined },
      currentSection: { value: undefined },
      focusedFields: { value: undefined },
      companyId: { value: undefined },
      conversationId: { value: undefined },
      debug: { value: false },
    }
  });

  // Add nodes to the graph
  workflow.addNode("classify_intent", classifyIntent);
  workflow.addNode("resolve_ambiguities", resolveAmbiguities);
  workflow.addNode("extract_field_updates", extractFieldUpdates);
  workflow.addNode("provide_field_information", provideFieldInformation);
  workflow.addNode("generate_response", generateResponse);
  workflow.addNode("error", (state: FormAgentState) => ({
    ...state,
    explanation: "Sorry, I encountered an error processing your request. Please try again."
  }));

  // Define the edges (routing logic)
  workflow.addEdge("classify_intent", router);
  workflow.addEdge("resolve_ambiguities", "extract_field_updates");
  workflow.addEdge("extract_field_updates", "generate_response");
  workflow.addEdge("provide_field_information", "generate_response");
  workflow.addEdge("generate_response", END);
  workflow.addEdge("error", END);

  // Set entry point
  workflow.setEntryPoint("classify_intent");

  // Return the compiled graph
  return workflow.compile();
}

/**
 * API function to process a message via the agent
 */
export async function processFormAgentMessage(
  message: string,
  formData: InsuranceForm,
  companyId: string = "",
  conversationId: string = "",
  debug: boolean = false
): Promise<{
  updates: Record<string, any>;
  explanation: string;
  currentSection?: string;
}> {
  try {
    const graph = buildFormAgentGraph();
    
    // Define initial state
    const initialState: FormAgentState = {
      messages: [new HumanMessage(message)],
      currentFormData: formData,
      companyId,
      conversationId,
      debug
    };
    
    // Run the graph
    const result = await graph.invoke(initialState);
    
    return {
      updates: result.fieldUpdates || {},
      explanation: result.explanation || "I processed your request.",
      currentSection: result.currentSection
    };
  } catch (error) {
    console.error("Error processing message with form agent:", error);
    return {
      updates: {},
      explanation: "Sorry, I encountered an error processing your request. Please try again."
    };
  }
} 