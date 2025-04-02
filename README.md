# Harper Form Generator

An AI-powered insurance form generation application for Harper Insurance Brokerage. This application allows users to select a company, generate an insurance form pre-filled with data extracted from company information and call transcripts, modify the form through a conversational interface, and download the completed form.

## Overview

Harper Form Generator streamlines the insurance form generation process by leveraging AI to extract relevant information from structured company data and unstructured call transcripts. The application provides a seamless experience from company selection to form download, with a conversational voice interface for making modifications.

## System Architecture

### Frontend
- **Framework**: Next.js 15 with React 19
- **Styling**: TailwindCSS
- **UI Components**: Custom components built with Radix UI primitives and shadcn/ui
- **Form Handling**: React Hook Form with Zod for validation

### Backend
- **API Routes**: Next.js API routes
- **Authentication**: Clerk
- **Data Storage**: External APIs for company data and memory retrieval

### AI Integration
- **LLM Provider**: OpenAI (primary), Google Generative AI (fallback)
- **Speech-to-Text**: Deepgram
- **Text-to-Speech**: Google Generative AI

### Document Generation
- **PDF Generation**: pdf-lib for creating and manipulating PDF documents

## Key Features

- **Company Selection**: Select from a list of available companies
- **Memory Retrieval**: Retrieve company-specific structured and unstructured data
- **Form Generation**: Extract relevant information from company data and generate pre-filled insurance forms
- **Conversational Form Editing**: Modify form fields through a conversational interface
- **Form Download**: Download the completed form as a PDF document
- **AI Fallback Mechanisms**: Graceful degradation when OpenAI is unavailable:
  1. First fallback: Switch to Gemini in text-only mode
  2. Second fallback: Simple form mode without AI assistance

## Data Flow

1. User authenticates via Clerk
2. User selects a company from the available list
3. System retrieves company-specific memory and data (structured and unstructured)
4. System extracts relevant information and pre-fills the insurance form
5. User interacts with the conversational interface to modify the form
6. System processes voice commands and updates the form in real-time
7. User downloads the completed form as a PDF

## LLM and Voice Integration

### Information Extraction Pipeline

1. **Data Retrieval**: When a company is selected, the application fetches both structured company data and unstructured call transcripts from an external API.

2. **Prompt Engineering**: The application constructs a specialized prompt that includes:
   - The structured company data
   - The unstructured call transcript data
   - A description of the form template
   - Instructions for extracting relevant information

3. **LLM Processing**: The prompt is sent to OpenAI's GPT model, which analyzes the data and extracts key information for the form fields.

4. **Response Parsing**: The application parses the JSON response from the LLM and maps the extracted values to the corresponding form fields.

### Conversational Voice Interface

1. **Speech Capture**: The application uses the browser's audio API to capture the user's voice input.

2. **Speech-to-Text Conversion**: The audio data is sent to Deepgram's API, which converts it to text with high accuracy, even with industry-specific terminology.

3. **Intent Analysis**: The text is processed by the LLM to determine the user's intent (e.g., updating a specific field, asking a question about the form).

4. **Form Modification**: If the intent is to modify the form, the application:
   - Identifies the target field
   - Extracts the new value
   - Updates the form state
   - Reflects the change in the UI

5. **Response Generation**: The application generates a natural language response confirming the action.

6. **Text-to-Speech**: The response is converted to speech using Google's Generative AI and played back to the user.

### Example Voice Commands

- "Update the deductible amount to $5,000"
- "Change the policy start date to January 1st, 2024"
- "Add 'We need additional coverage for flood protection' to the special requirements field"
- "What is our current liability coverage?"

## Technologies Used

- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- Clerk Authentication
- OpenAI API for data extraction and conversational form editing
- Google Generative AI (Gemini) as a fallback option
- Deepgram for speech-to-text conversion
- PDF-lib for PDF generation

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn
- API keys for Clerk, OpenAI, Deepgram, and optionally Gemini

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/harper-form-generator.git
   cd harper-form-generator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following environment variables:
   ```
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key

   # OpenAI API
   OPENAI_API_KEY=your_openai_api_key
   NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key

   # Gemini API (for OpenAI fallback)
   GEMINI_API_KEY=your_gemini_api_key
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

   # Deepgram API (for voice interface)
   DEEPGRAM_API_KEY=your_deepgram_api_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Key Implementations

### Company Selection and Memory Retrieval

The application provides a clean, intuitive interface where users can select from a list of insurance companies. When a company is selected, the system makes API calls to retrieve two types of data:

1. **Structured Company Data**: This includes formal information about the company such as name, industry, revenue, employee count, and contact details. This data is well-organized and easy to map to form fields.

2. **Unstructured Call Transcripts**: These are records of conversations with company representatives that contain valuable information about their insurance needs, but in a conversational format that requires AI analysis to extract.

The system uses Next.js API routes to fetch this data, which is then securely stored in the application state for processing.

### AI-Powered Form Generation

Once company data is retrieved, the application leverages OpenAI's powerful language models to analyze and extract relevant information:

1. **Information Extraction**: The system creates a carefully engineered prompt that includes both structured and unstructured data, along with the form template. This prompt instructs the AI to identify key information needed for the insurance form.

2. **Context Understanding**: The AI analyzes call transcripts to understand nuanced details like coverage preferences, past claims, and special requirements that might not be part of the structured data.

3. **Form Mapping**: The extracted information is then intelligently mapped to the appropriate fields in the insurance form template, creating a pre-filled form that saves significant time for insurance brokers.

The system handles uncertainty gracefully - when information is missing or ambiguous, it leaves fields blank rather than guessing, allowing users to provide this information through the conversational interface.

### Voice-Powered Conversational Interface

The most innovative aspect of the application is its conversational voice interface, which allows users to modify form fields naturally:

1. **Voice Capture and Processing**: The system captures user voice input through the browser's microphone API and sends it to Deepgram's specialized speech-to-text service, which is particularly effective at handling industry-specific terminology.

2. **Natural Language Understanding**: The transcribed text is sent to the AI model, which analyzes the intent behind the user's statement or question. The system can distinguish between commands to update fields, questions about current values, and general inquiries.

3. **Contextual Form Updates**: When the user requests changes, the AI identifies which field to update and what the new value should be, even when the request is phrased conversationally. For example, "The deductible should be five thousand dollars" is correctly interpreted and applied to the proper field.

4. **Interactive Feedback**: After processing each command, the system generates a natural language response confirming the action taken (e.g., "I've updated the deductible to $5,000"), which is then converted to speech and played back to the user.

This voice interface dramatically improves efficiency and accessibility, allowing users to complete forms while multitasking or accommodating users with mobility limitations.

### PDF Generation and Download

The final step in the process allows users to download the completed form:

1. **Document Generation**: The application uses pdf-lib, a client-side PDF generation library, to create professional, well-formatted insurance forms that match industry standards.

2. **Field Mapping**: All form fields from the application interface are precisely mapped to corresponding positions in the PDF document.

3. **Secure Download**: The generated PDF is made available for download directly in the browser without sending sensitive data to external services, ensuring data privacy.

4. **Print-Ready Format**: The generated documents are optimized for both digital viewing and printing, maintaining consistent formatting across devices.

### Robust Fallback Mechanisms

To ensure reliability in all circumstances, the application implements tiered fallback strategies:

1. **Primary AI Service**: OpenAI is used as the primary AI service for all intelligent features.

2. **Secondary AI Service**: If OpenAI is unavailable or experiencing issues, the system automatically switches to Google's Gemini AI model as a backup.

3. **Minimal Functionality Mode**: In the rare case that both AI services are unavailable, the application degrades gracefully to a basic form interface where users can manually fill out fields without AI assistance.

This approach ensures that the application remains functional even during service disruptions, prioritizing availability and user experience.

## Error Handling and Fallbacks

The application implements a tiered fallback mechanism:

1. **Primary Mode**: Uses OpenAI for all AI features (form generation, conversational interface, speech-to-text, text-to-speech)
2. **Fallback Mode 1**: If OpenAI is unavailable, switches to Google's Gemini API for text-only form generation and conversational interface
3. **Fallback Mode 2**: If both AI services are unavailable, switches to a basic form-only mode without AI assistance

## Security Considerations

- Secure handling of sensitive insurance information
- Compliance with relevant regulations (GDPR, HIPAA, etc.)
- Encryption of data in transit and at rest
- Authentication and authorization via Clerk
- Rate limiting to prevent abuse

## Future Improvements

- Multi-language support
- Templating system for custom form layouts
- Batch processing for multiple forms
- Integration with document storage systems
- Form extraction and transposition tool (Bonus Challenge)
- Fine-tuned models for insurance-specific terminology
- Enhanced entity extraction for more accurate form pre-filling

## License

This project is licensed under the MIT License.

## Acknowledgements

- Harper Insurance Brokerage
- Clerk Authentication
- OpenAI
- Google Generative AI
- Deepgram
