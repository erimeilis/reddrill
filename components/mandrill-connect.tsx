'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMandrillStore } from '@/lib/store/useMandrillStore';

export function MandrillConnect() {
  const router = useRouter();
  const { apiKey, isConnected, loading: storeLoading, error: storeError, setApiKey } = useMandrillStore();

  // Local UI state
  const [apiKeyInput, setApiKeyInput] = useState<string>(apiKey || '');
  const [isNavigating, setIsNavigating] = useState<boolean>(false);

  // Initialize Mandrill client when API key is provided
  const connectToMandrill = async () => {
    if (!apiKeyInput.trim()) {
      return;
    }

    try {
      // setApiKey will throw an error if the key is invalid
      await setApiKey(apiKeyInput);

      // Double-check that we're actually connected before navigating
      // This prevents navigation if the connection somehow failed silently
      const { isConnected: connected } = useMandrillStore.getState();

      if (connected) {
        // Set navigating state to prevent component from unmounting
        setIsNavigating(true);
        // Navigate immediately
        router.push('/templates');
      } else {
        // Connection failed but no error was thrown - this shouldn't happen
        console.error('Connection check failed after setApiKey');
      }
    } catch (err) {
      // Error is already set in store by setApiKey, just log it
      console.error('Failed to connect to Mandrill:', err);
      // Error will be displayed by the storeError in the UI
    }
  };

  // Don't render anything if already connected and not navigating
  if (isConnected && !storeLoading && !isNavigating) {
    return null;
  }

  // Show loading state during navigation
  const isLoading = storeLoading || isNavigating;

  return (
    <div className="container mx-auto px-4 py-4 sm:py-6">
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card className="w-full max-w-md shadow-sm relative">
          {isLoading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
              <div className="text-center">
                <svg className="animate-spin h-8 w-8 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-sm font-medium">
                  {isNavigating ? 'Loading templates...' : 'Connecting to Mandrill...'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
              </div>
            </div>
          )}
          <CardHeader>
            <CardTitle>Connect to Mandrill</CardTitle>
            <CardDescription>Enter your Mandrill API key to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); connectToMandrill(); }} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Mandrill API Key"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full"
                  autoFocus
                  disabled={isLoading}
                />
                {storeError && (
                  <div className="text-sm text-destructive">
                    {storeError}
                  </div>
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !apiKeyInput.trim()}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isNavigating ? 'Loading...' : 'Connecting...'}
                  </span>
                ) : (
                  'Connect'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
