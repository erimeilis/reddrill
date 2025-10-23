'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMandrillStore } from '@/lib/store/useMandrillStore';

/**
 * Hook to check if the Mandrill client is initialized and connected
 * @param requireAuth - If true, redirect to home if not authenticated
 * @returns An object with isConnected and loading states
 */
export function useMandrillConnection(requireAuth: boolean = false) {
  const router = useRouter();
  const { isConnected, loading, hydrated } = useMandrillStore();

  useEffect(() => {
    // Only check auth after store is hydrated from IndexedDB
    if (requireAuth && hydrated && !loading && !isConnected) {
      // Not authenticated, redirect to home
      router.push('/');
    }
  }, [requireAuth, hydrated, loading, isConnected, router]);

  return { isConnected, loading };
}