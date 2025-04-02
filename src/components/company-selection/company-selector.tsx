import { useState, useEffect, useRef } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Company } from '@/types';
import { Building, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CompanySelectorProps {
  onSelectCompany: (companyId: string) => void;
}

interface PaginationData {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasMore: boolean;
}

export function CompanySelector({ onSelectCompany }: CompanySelectorProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 50,
    totalItems: 0,
    totalPages: 0,
    hasMore: false
  });
  const selectContentRef = useRef<HTMLDivElement>(null);

  const fetchCompanies = async (page = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      const response = await fetch(`/api/companies?page=${page}&limit=${pagination.limit}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch companies');
      }

      if (append) {
        setCompanies(prevCompanies => [...prevCompanies, ...data.data]);
      } else {
        setCompanies(data.data);
      }
      
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleLoadMore = () => {
    if (pagination.hasMore) {
      fetchCompanies(pagination.page + 1, true);
    }
  };

  const handleSelectChange = (value: string) => {
    onSelectCompany(value);
  };

  if (loading && companies.length === 0) {
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

  if (error && companies.length === 0) {
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
                onClick={() => fetchCompanies()}
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
        <SelectContent ref={selectContentRef}>
          {companies.length === 0 ? (
            <div className="py-2 px-3 text-sm text-gray-500 dark:text-gray-400">
              No companies available
            </div>
          ) : (
            <>
              {companies.map((company) => (
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
              ))}
              
              {pagination.hasMore && (
                <div className="p-2 flex justify-center border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="w-full flex items-center justify-center"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>Load more companies</>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </SelectContent>
      </Select>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Select a company to generate an insurance form with AI
        {pagination.totalItems > 0 && ` • Showing ${companies.length} of ${pagination.totalItems} companies`}
      </p>
    </div>
  );
} 