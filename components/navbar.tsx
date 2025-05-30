'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { IconMenu2, IconX, IconLogout } from '@tabler/icons-react';
import { getApiKey, clearApiKey } from '@/lib/storage/indexeddb';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    // Check if we have an API key stored
    const apiKey = await getApiKey();
    if (apiKey) {
      if (confirm('Are you sure you want to log out? This will clear your Mandrill API key.')) {
        await clearApiKey();
        window.location.reload();
      }
    }
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image src="/logo.svg" alt="Reddrill Logo" width={36} height={36} />
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            <Button 
              variant="icon" 
              size="icon" 
              onClick={handleLogout}
              aria-label="Logout"
              title="Logout"
            >
              <IconLogout size={20} stroke={1.5} />
            </Button>
          </div>

          {/* Mobile navigation */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <Button 
              variant="icon" 
              size="icon" 
              onClick={handleLogout}
              aria-label="Logout"
              title="Logout"
            >
              <IconLogout size={20} stroke={1.5} />
            </Button>
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
            <div className="flex flex-col items-center space-y-2 py-2">
              {/* Mobile menu content goes here if needed */}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
