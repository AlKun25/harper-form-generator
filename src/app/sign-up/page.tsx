'use client';

import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignUp 
        appearance={{
          baseTheme: dark,
          elements: {
            card: "bg-gray-800 shadow-xl border border-gray-700",
            formButtonPrimary: "bg-blue-600 hover:bg-blue-700",
            formFieldInput: "bg-gray-900 border-gray-700",
            headerTitle: "text-white",
            headerSubtitle: "text-gray-300",
            dividerLine: "bg-gray-700",
            dividerText: "text-gray-400",
            formFieldLabel: "text-gray-300",
            footerActionLink: "text-blue-400 hover:text-blue-300",
          }
        }}
        routing="path"
        path="/sign-up"
      />
    </div>
  );
} 