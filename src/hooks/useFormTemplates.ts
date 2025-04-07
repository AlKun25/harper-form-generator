import { useState, useEffect } from 'react';
import { FormInstance } from '@/types';

interface UseFormTemplatesReturn {
  availableTemplates: FormInstance[];
  isLoading: boolean;
  error: Error | null;
  loadTemplate: (templateId: string) => Promise<FormInstance | null>;
}

/**
 * Custom hook for managing form templates
 */
export default function useFormTemplates(): UseFormTemplatesReturn {
  const [availableTemplates, setAvailableTemplates] = useState<FormInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Load available templates on mount
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real app, this would fetch from an API
      // For now, we'll return mock data
      const mockTemplates: FormInstance[] = [
        {
          id: 'template-1',
          name: 'Small Business General Liability',
          description: 'Basic template for small business GL insurance',
          type: 'general-liability',
          dateCreated: new Date().toISOString(),
          dateModified: new Date().toISOString(),
          formData: {
            industry: 'Retail',
            deductibleAmount: 1000,
            coverageLimit: 1000000
          }
        },
        {
          id: 'template-2',
          name: 'Technology Company',
          description: 'Template for technology companies',
          type: 'professional-liability',
          dateCreated: new Date().toISOString(),
          dateModified: new Date().toISOString(),
          formData: {
            industry: 'Technology',
            deductibleAmount: 5000,
            coverageLimit: 2000000
          }
        }
      ];
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAvailableTemplates(mockTemplates);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error fetching templates'));
      console.error('Error fetching templates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplate = async (templateId: string): Promise<FormInstance | null> => {
    try {
      // Find template in available templates
      const template = availableTemplates.find(t => t.id === templateId);
      
      if (!template) {
        console.error(`Template with ID ${templateId} not found`);
        return null;
      }
      
      return template;
    } catch (err) {
      console.error(`Error loading template ${templateId}:`, err);
      return null;
    }
  };

  return {
    availableTemplates,
    isLoading,
    error,
    loadTemplate
  };
} 