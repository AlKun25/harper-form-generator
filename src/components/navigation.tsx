import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUser, UserButton } from '@clerk/nextjs';
import { FileText, LayoutGrid, Sparkles } from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();
  const { isLoaded, isSignedIn, user } = useUser();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
    { name: 'Companies', href: '/companies', icon: FileText },
    { name: 'Dynamic Forms', href: '/dynamic-form', icon: Sparkles }
  ];

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="container py-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400 mr-8">
            Harper Form Generator
          </Link>
          
          <nav className="hidden md:flex space-x-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700/50"
                  )}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {isLoaded && isSignedIn && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {user?.firstName 
                  ? `Welcome, ${user.firstName}` 
                  : user?.emailAddresses?.[0]?.emailAddress 
                    && `Welcome, ${user.emailAddresses[0]?.emailAddress}`}
              </span>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
} 