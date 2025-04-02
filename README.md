# Harper Form Generator

An AI-powered insurance form generation application for Harper Insurance Brokerage. This application allows users to select a company, generate an insurance form pre-filled with data extracted from company information and call transcripts, modify the form through a conversational interface, and download the completed form.

## Features

- **Company Selection**: Select from a list of available companies
- **Memory Retrieval**: Retrieve company-specific structured and unstructured data
- **Form Generation**: Extract relevant information from company data and generate pre-filled insurance forms
- **Conversational Form Editing**: Modify form fields through a conversational interface
- **Form Download**: Download the completed form as a PDF document

## Technologies Used

- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- Clerk Authentication
- OpenAI API for data extraction and conversational form editing
- PDF-lib for PDF generation

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn
- API keys for Clerk and OpenAI

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

   # Deepgram API (for voice interface)
   DEEPGRAM_API_KEY=your_deepgram_api_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Sign in with your Clerk account
2. Select a company from the dropdown menu
3. The application will generate a pre-filled insurance form based on the company's data
4. Use the conversational interface to modify form fields
5. Download the completed form as a PDF

## Deployment

This application can be deployed to Render using the Hobby tier.

## License

This project is licensed under the MIT License.

## Acknowledgements

- Harper Insurance Brokerage
- Clerk Authentication
- OpenAI
- Deepgram
