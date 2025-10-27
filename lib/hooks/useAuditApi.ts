/**
 * Hook for making audit API calls with automatic API key injection
 * Ensures all audit operations are isolated per API key
 */

import { useMandrillStore } from '@/lib/store/useMandrillStore';

export function useAuditApi() {
  const { apiKey } = useMandrillStore();

  /**
   * Make an audit API call with API key automatically included in headers
   */
  const auditFetch = async (url: string, options?: RequestInit): Promise<Response> => {
    if (!apiKey) {
      throw new Error('No API key available - please connect to Mandrill first');
    }

    const headers = new Headers(options?.headers);
    headers.set('X-API-Key', apiKey);

    return fetch(url, {
      ...options,
      headers,
    });
  };

  return { auditFetch, hasApiKey: !!apiKey };
}
