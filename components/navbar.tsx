'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { SettingsDialog } from '@/components/settings-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { IconMenu2, IconX, IconLogout, IconTemplate, IconTags, IconMail } from '@tabler/icons-react';
import { useMandrillStore } from '@/lib/store/useMandrillStore';
import { useMandrillConnection } from '@/lib/hooks/useMandrillConnection';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isConnected } = useMandrillConnection();
  const { apiKey, clearApiKey } = useMandrillStore();

  // Check if user has API key on component mount
  useEffect(() => {
    const checkApiKey = () => {
      // If no API key and not on home page, redirect to home
      if (!apiKey && pathname !== '/') {
        // Redirect to home with a hard refresh
        window.location.href = '/';
      }
    };

    checkApiKey();
  }, [pathname, apiKey]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Function to create URLs with current query parameters
  const createUrl = (path: string) => {
    // Create a URLSearchParams object from the current search params
    const params = new URLSearchParams();
    searchParams.forEach((value, key) => {
      params.append(key, value);
    });

    // Append the search params to the URL if there are any
    const queryString = params.toString();
    return queryString ? `${path}?${queryString}` : path;
  };

  // Navigation items
  const navItems = [
    { href: '/templates', label: 'Templates', icon: <IconTemplate size={20} stroke={1.5} /> },
    { href: '/tags', label: 'Tags', icon: <IconTags size={20} stroke={1.5} /> },
    { href: '/senders', label: 'Senders', icon: <IconMail size={20} stroke={1.5} /> },
  ];

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = async () => {
    // Clear API key from store
    await clearApiKey();

    // Close the dialog
    setShowLogoutDialog(false);

    // Small delay to ensure store is cleared
    setTimeout(() => {
      // Force a hard refresh to the home page
      window.location.href = '/';
    }, 100);
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link href={createUrl('/')} className="flex items-center">
              <Image 
                src="/icon.svg" 
                alt="Reddrill Logo" 
                width={54} 
                height={54}
                className="rounded-full" // Makes the image circular
              />
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {isConnected && (
              <div className="flex items-center space-x-2 mr-2">
                {navItems.map((item) => (
                  <Link 
                    key={item.href} 
                    href={createUrl(item.href)}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname === item.href 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
            {isConnected && <SettingsDialog />}
            <ThemeToggle />
            {isConnected && (
              <Button
                variant="icon"
                size="icon"
                onClick={handleLogoutClick}
                aria-label="Logout"
                title="Logout"
              >
                <IconLogout size={20} stroke={1.5} />
              </Button>
            )}
          </div>

          {/* Mobile navigation */}
          <div className="md:hidden flex items-center space-x-2">
            {isConnected && <SettingsDialog />}
            <ThemeToggle />
            {isConnected && (
              <Button
                variant="icon"
                size="icon"
                onClick={handleLogoutClick}
                aria-label="Logout"
                title="Logout"
              >
                <IconLogout size={20} stroke={1.5} />
              </Button>
            )}
            <Button 
              variant="icon" 
              size="icon" 
              onClick={toggleMenu}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? (
                <IconX size={24} stroke={1.5} />
              ) : (
                <IconMenu2 size={24} stroke={1.5} />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-background border-b border-border">
            {isConnected && (
              <div className="flex flex-col space-y-2 py-2">
                {navItems.map((item) => (
                  <Link 
                    key={item.href} 
                    href={createUrl(item.href)}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname === item.href 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Logout confirmation dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out? This will clear your Mandrill API key from this device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogoutConfirm}>
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </nav>
  );
}
