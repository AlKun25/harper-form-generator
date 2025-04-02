import { useState, useEffect } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Company } from '@/types';
import { Building } from 'lucide-react';

interface CompanySelectorProps {
  onSelectCompany: (companyId: string) => void;
}

export function CompanySelector({ onSelectCompany }: CompanySelectorProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/companies');
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch companies');
        }

        setCompanies(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const handleSelectChange = (value: string) => {
    onSelectCompany(value);
  };

  if (loading) {
    return (
      <div className="w-full max-w-md">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select a company
        </label>
        <div className="animate-pulse flex items-center">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading available companies...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-md">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select a company
        </label>
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-300 dark:border-red-800">
          <div className="flex">
            <div className="text-red-600 dark:text-red-400">
              <p className="text-sm font-medium">Error loading companies</p>
              <p className="mt-1 text-xs">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Select a company
      </label>
      <Select onValueChange={handleSelectChange}>
        <SelectTrigger className="flex items-center h-10 pl-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm">
          <span className="mr-2 text-gray-400">
            <Building size={18} />
          </span>
          <SelectValue placeholder="Select a company" />
        </SelectTrigger>
        <SelectContent>
          {companies.length === 0 ? (
            <div className="py-2 px-3 text-sm text-gray-500 dark:text-gray-400">
              No companies available
            </div>
          ) : (
            companies.map((company) => (
              <SelectItem 
                key={company.id} 
                value={company.id}
                className="py-2 pl-3 pr-9 text-sm font-medium text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              >
                <div className="flex items-center">
                  <span className="font-medium">{company.name}</span>
                  <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">- {company.industry}</span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Select a company to generate an insurance form with AI
      </p>
    </div>
  );
} 