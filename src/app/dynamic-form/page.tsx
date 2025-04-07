'use client';

import { useState, useEffect, useRef } from 'react';
import { DynamicForm } from '@/components/forms/dynamic-form';
import { DynamicFormSchema, EXAMPLE_PERSONAL_INFO_SCHEMA } from '@/types/dynamic-form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, RefreshCw, Info, CheckCircle2 } from 'lucide-react';
import { Navigation } from '@/components/navigation';
import { ApiKeyInput } from '@/components/ui/api-key-input';

// Simple alert function instead of toast
const showAlert = (message: string) => {
  const alertEl = document.createElement('div');
  alertEl.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md shadow-lg z-50';
  alertEl.innerHTML = `
    <div class="flex">
      <div class="py-1"><svg class="fill-current h-6 w-6 text-green-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 10.32 10.32zM6.7 9.29L9 11.6l4.3-4.3 1.4 1.42L9 14.4l-3.7-3.7 1.4-1.42z"/></svg></div>
      <div>
        <p>${message}</p>
      </div>
      <button class="ml-auto pl-3" onclick="this.parentElement.parentElement.remove()">
        <svg class="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
      </button>
    </div>
  `;
  document.body.appendChild(alertEl);
  
  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    if (document.body.contains(alertEl)) {
      document.body.removeChild(alertEl);
    }
  }, 5000);
};

const PROMPT_SUGGESTIONS = [
  "Create a job application form with personal details, education history, work experience, and skills sections",
  "Generate a patient intake form for a medical clinic with personal information, medical history, and current symptoms",
  "Design a contact form with name, email, subject, and message fields",
  "Build a product feedback survey with rating scales and open-ended questions",
  "Create a real estate listing form with property details, features, and pricing information"
];

export default function DynamicFormPage() {
  const [formSchema, setFormSchema] = useState<DynamicFormSchema | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [prompt, setPrompt] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promptSuggestion, setPromptSuggestion] = useState('');
  const [showSubmissionSuccess, setShowSubmissionSuccess] = useState(false);
  const formDataRef = useRef<HTMLDivElement>(null);

  // Choose a random prompt suggestion
  useEffect(() => {
    const randomSuggestion = PROMPT_SUGGESTIONS[Math.floor(Math.random() * PROMPT_SUGGESTIONS.length)];
    setPromptSuggestion(randomSuggestion);
  }, []);

  const handleGenerateForm = async (useExample = false) => {
    try {
      setLoading(true);
      setError(null);
      setFormData({});
      setShowSubmissionSuccess(false);

      if (useExample) {
        // Use the example schema
        setFormSchema(EXAMPLE_PERSONAL_INFO_SCHEMA);
        setLoading(false);
        return;
      }

      if (!prompt.trim()) {
        setError('Please enter a prompt describing the form you want to generate.');
        setLoading(false);
        return;
      }

      if (!openaiKey.trim()) {
        setError('Please enter your OpenAI API key.');
        setLoading(false);
        return;
      }

      if (!openaiKey.startsWith('sk-')) {
        setError('Please enter a valid OpenAI API key. It should start with "sk-".');
        setLoading(false);
        return;
      }

      console.log('Sending request to generate form...');
      
      // Call our API to generate the form
      try {
        const response = await fetch('/api/form-generation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt, openaiKey }),
        });

        const data = await response.json();
        console.log('Response received:', data.success ? 'success' : 'failure');

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to generate form');
        }

        console.log('Setting form schema...');
        setFormSchema(data.data);
        // Show a success alert
        showAlert("Form generated successfully! You can now fill it out.");
      } catch (fetchError) {
        console.error('Fetch error:', fetchError);
        setError(fetchError instanceof Error ? 
          `API error: ${fetchError.message}` : 
          'Network error when connecting to the API');
        throw fetchError;
      }
    } catch (err) {
      console.error('Error generating form:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const handleUsePromptSuggestion = () => {
    setPrompt(promptSuggestion);
  };

  const handleGetNewSuggestion = () => {
    let newSuggestion;
    do {
      newSuggestion = PROMPT_SUGGESTIONS[Math.floor(Math.random() * PROMPT_SUGGESTIONS.length)];
    } while (newSuggestion === promptSuggestion);
    
    setPromptSuggestion(newSuggestion);
  };

  const handleFormSubmit = (data: Record<string, any>) => {
    setFormData(data);
    setShowSubmissionSuccess(true);
    console.log('Form submitted with data:', data);
    
    // Scroll to form data
    setTimeout(() => {
      formDataRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">Dynamic Form Generator</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          This tool generates custom forms based on your description. Simply describe the form you need,
          and our AI will create it for you instantly. You can then fill it out and view the collected data.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <Card>
            <CardHeader>
              <CardTitle>Generate a Form</CardTitle>
              <CardDescription>
                Describe the form you want to create in detail. The more specific your description,
                the better the generated form will match your needs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="prompt">Form Description</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Describe what fields and sections you want in your form..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[120px]"
                  />
                  <div className="flex items-start mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <Info className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                    <span>
                      Try to be specific about the types of fields you need (text, number, date, etc.)
                      and how they should be organized.
                    </span>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-800">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Need inspiration?</p>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-2 text-blue-600"
                      onClick={handleGetNewSuggestion}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      <span className="text-xs">New suggestion</span>
                    </Button>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-200 mb-2">{promptSuggestion}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-blue-600 border-blue-200 hover:border-blue-300"
                    onClick={handleUsePromptSuggestion}
                  >
                    Use this prompt
                  </Button>
                </div>

                <ApiKeyInput
                  id="openai-key"
                  label="OpenAI API Key"
                  placeholder="Enter your OpenAI API key (starts with sk-)"
                  value={openaiKey}
                  onChange={setOpenaiKey}
                  description="Your API key is only used for this request and is not stored on our servers."
                />

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    onClick={() => handleGenerateForm(false)}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Form'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleGenerateForm(true)}
                    disabled={loading}
                    className="flex-1"
                  >
                    Use Example Form
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {formSchema && Object.keys(formData).length > 0 && (
            <Card ref={formDataRef}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                  Form Data Submitted
                </CardTitle>
                <CardDescription>
                  This is the data collected from your form submission
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto max-h-[400px] text-sm">
                  {JSON.stringify(formData, null, 2)}
                </pre>
              </CardContent>
              <CardFooter className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm border-t border-green-100 dark:border-green-800">
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Form submission successful! This data would typically be sent to a server for processing.
                </div>
              </CardFooter>
            </Card>
          )}
        </div>

        {formSchema && (
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg p-6">
            {showSubmissionSuccess && (
              <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-md p-4 flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-medium text-green-800 dark:text-green-300">Form Submitted Successfully</h3>
                  <p className="text-green-700 dark:text-green-400 text-sm mt-1">
                    Your form data has been collected and is displayed above. You can edit and submit again if needed.
                  </p>
                </div>
              </div>
            )}
            <DynamicForm
              schema={formSchema}
              initialData={formData}
              onSubmit={handleFormSubmit}
            />
          </div>
        )}
      </div>
    </div>
  );
} 