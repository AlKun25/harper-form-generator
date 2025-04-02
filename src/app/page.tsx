'use client';

import { useState, useEffect } from 'react';
import { CompanySelector } from '@/components/company-selection/company-selector';
import { InsuranceForm } from '@/components/forms/insurance-form';
import { ConversationInterface } from '@/components/forms/conversation-interface';
import { InsuranceForm as InsuranceFormType } from '@/types';
import { useUser, UserButton, SignInButton, SignUpButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);

  // If authentication is not loaded yet, show a loading indicator
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em]"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl mb-8">
            <span className="text-blue-500">Harper</span> Form Generator
          </h1>
          <p className="max-w-xl mx-auto text-xl text-gray-300 mb-10">
            Generate insurance forms quickly and efficiently with our AI-powered solution.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SignInButton mode="modal">
              <button className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Sign In
              </button>
            </SignInButton>
            
            <SignUpButton mode="modal">
              <button className="px-8 py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors border border-gray-700">
                Sign Up
              </button>
            </SignUpButton>
          </div>
        </div>
        
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="text-blue-400 text-2xl font-bold mb-4">Fast & Efficient</div>
            <p className="text-gray-300">Generate complete insurance forms in seconds with our advanced AI technology.</p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="text-blue-400 text-2xl font-bold mb-4">Secure</div>
            <p className="text-gray-300">Your data is encrypted and secure with our enterprise-grade security measures.</p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="text-blue-400 text-2xl font-bold mb-4">Customizable</div>
            <p className="text-gray-300">Easily customize and edit forms to meet your specific requirements.</p>
          </div>
        </div>
      </div>
      
      <footer className="bg-gray-800 mt-24 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400">
          <p>Harper Insurance Brokerage AI Form Generator</p>
          <p className="mt-2">© {new Date().getFullYear()} Harper Insurance</p>
        </div>
      </footer>
    </main>
  );
}
