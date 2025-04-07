'use client';

import { useState, useEffect } from 'react';
import { ACORD126Form } from '@/types/acord126';
import { ACORD126FormComponent } from '@/components/forms/acord126-form';
import { mapMemoryToACORD126 } from '@/utils/acord126-mapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function ACORD126Page() {
  const [formData, setFormData] = useState<ACORD126Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMemoryData();
  }, []);

  const fetchMemoryData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Replace with your actual memory API endpoint
      const response = await fetch('/api/memory');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch memory data: ${response.statusText}`);
      }
      
      const memoryData = await response.json();
      
      // Map memory data to ACORD126 form format
      const acord126Data = mapMemoryToACORD126(memoryData);
      setFormData(acord126Data);
    } catch (err) {
      console.error('Error fetching memory data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      
      // Create empty form data if fetch fails
      setFormData(mapMemoryToACORD126({}));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveForm = async (updatedForm: Partial<ACORD126Form>) => {
    setSaving(true);
    try {
      // Replace with your actual save API endpoint
      const response = await fetch('/api/forms/acord126', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedForm),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save form: ${response.statusText}`);
      }
      
      const result = await response.json();
      alert('Form saved successfully!');
      
      // Update the form data with the saved data
      setFormData({
        ...formData,
        ...updatedForm,
      } as ACORD126Form);
    } catch (err) {
      console.error('Error saving form:', err);
      alert(`Error saving form: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md p-6">
          <CardContent className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mt-2" />
            <p className="mt-4 text-lg font-medium">Loading form data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md p-6">
          <CardContent className="flex flex-col items-center">
            <p className="text-red-500 font-medium">Error: {error}</p>
            <Button 
              onClick={fetchMemoryData}
              className="mt-4"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md p-6">
          <CardContent className="flex flex-col items-center">
            <p className="text-yellow-500 font-medium">No form data available.</p>
            <Button 
              onClick={fetchMemoryData}
              className="mt-4"
            >
              Reload
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">ACORD 126 Form</h1>
        {saving && (
          <div className="flex items-center">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span>Saving...</span>
          </div>
        )}
      </div>
      <ACORD126FormComponent 
        formData={formData} 
        onEditForm={handleSaveForm} 
      />
    </div>
  );
} 