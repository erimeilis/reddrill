'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMandrillConnection } from '@/lib/hooks/useMandrillConnection';

export default function Page() {
  const router = useRouter();
  const { isConnected } = useMandrillConnection();

  useEffect(() => {
    // Redirect to templates when connected
    if (isConnected) {
      router.replace('/templates');
    }
  }, [isConnected, router]);

  // Render nothing - redirect will happen via slots or redirect
  return null;
}
