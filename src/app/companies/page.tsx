'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Company } from '@/types';
import { Building, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser, UserButton } from '@clerk/nextjs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PaginationData {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasMore: boolean;
}

export default function CompaniesPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [formDialogOpen, setFormDialogOpen] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

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
        const newCompanies = [...companies, ...data.data];
        setCompanies(newCompanies);
        filterCompanies(newCompanies, searchQuery);
      } else {
        setCompanies(data.data);
        filterCompanies(data.data, searchQuery);
      }
      
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const filterCompanies = (companies: Company[], query: string) => {
    if (!query.trim()) {
      setFilteredCompanies(companies);
      return;
    }
    
    const lowercaseQuery = query.toLowerCase();
    const filtered = companies.filter(company => 
      company.name.toLowerCase().includes(lowercaseQuery) || 
      company.id.toLowerCase().includes(lowercaseQuery) ||
      (company.industry && company.industry.toLowerCase().includes(lowercaseQuery))
    );
    
    setFilteredCompanies(filtered);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    filterCompanies(companies, searchQuery);
  }, [searchQuery]);

  const handleLoadMore = () => {
    if (pagination.hasMore) {
      fetchCompanies(pagination.page + 1, true);
    }
  };

  const handleCompanyClick = (company: Company) => {
    setSelectedCompany(company);
    setFormDialogOpen(true);
  };

  const navigateToForm = (formType: 'acord125' | 'acord126') => {
    if (!selectedCompany) return;
    
    if (formType === 'acord125') {
      router.push(`/company/${selectedCompany.id}`);
    } else {
      router.push(`/company-acord126/${selectedCompany.id}`);
    }
    
    setFormDialogOpen(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em]"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="container py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Harper Form Generator</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {user?.firstName ? `Welcome, ${user.firstName}` : user?.emailAddresses?.[0]?.emailAddress && `Welcome, ${user.emailAddresses[0]?.emailAddress}`}
              </span>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Search Companies</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Find a company to generate an insurance form</p>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by company name or ID..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {loading && companies.length === 0 ? (
            <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg shadow-md animate-pulse">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 dark:border-blue-400 border-r-transparent align-[-0.125em]"></div>
              <p className="mt-4 text-lg font-medium">Loading companies...</p>
            </div>
          ) : error && companies.length === 0 ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-4 rounded-lg shadow-md mb-6">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
              <button 
                onClick={() => fetchCompanies()}
                className="mt-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCompanies.length === 0 ? (
                  <li className="p-6 text-center text-gray-500 dark:text-gray-400">
                    {searchQuery ? 'No companies match your search' : 'No companies available'}
                  </li>
                ) : (
                  filteredCompanies.map(company => (
                    <li 
                      key={company.id} 
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                      onClick={() => handleCompanyClick(company)}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                          <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0 ml-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {company.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            ID: {company.id} {company.industry ? `• ${company.industry}` : ''}
                          </p>
                        </div>
                        <div>
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
              
              {pagination.hasMore && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="w-full flex items-center justify-center"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Loading more companies...
                      </>
                    ) : (
                      <>Load more companies</>
                    )}
                  </Button>
                </div>
              )}
              
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Showing {filteredCompanies.length} {searchQuery ? 'matching' : ''} companies
                  {pagination.totalItems > 0 && ` out of ${pagination.totalItems} total`}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="mt-20 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6">
        <div className="container text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Harper Insurance Brokerage AI Form Generator</p>
          <p className="mt-2">© {new Date().getFullYear()} Harper Insurance</p>
        </div>
      </footer>

      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Select Form Type</DialogTitle>
            <DialogDescription className="pt-2">
              Choose which insurance form you want to generate for <span className="font-semibold">{selectedCompany?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
            <div 
              className="border rounded-lg p-5 flex flex-col items-center justify-center cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onClick={() => navigateToForm('acord125')}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => e.key === 'Enter' && navigateToForm('acord125')}
            >
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-700 font-bold text-xl">125</span>
                </div>
                <h3 className="font-bold text-lg">ACORD 125</h3>
              </div>
              <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                Commercial Insurance Application - Basic information about the applicant
              </p>
            </div>
            
            <div 
              className="border rounded-lg p-5 flex flex-col items-center justify-center cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onClick={() => navigateToForm('acord126')}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => e.key === 'Enter' && navigateToForm('acord126')}
            >
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-blue-700 font-bold text-xl">126</span>
                </div>
                <h3 className="font-bold text-lg">ACORD 126</h3>
              </div>
              <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                Commercial General Liability Section - Detailed liability coverage information
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
} 