import { useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import mandrillClient, { type MandrillTemplate, type MandrillTemplateInfo } from '@/lib/api/mandrill';
import { useMandrillStore } from '@/lib/store/useMandrillStore';

// Fetcher function that uses mandrillClient directly (client-side only!)
const fetcher = async () => {
  if (!mandrillClient.isInitialized()) {
    throw new Error('Mandrill client not initialized');
  }
  return await mandrillClient.listTemplates();
};

const templateFetcher = async (slug: string) => {
  if (!mandrillClient.isInitialized()) {
    throw new Error('Mandrill client not initialized');
  }
  return await mandrillClient.getTemplateInfo(slug);
};

// Hook to fetch all templates with IndexedDB caching (instant load!)
export function useTemplates() {
  const { getCachedTemplates, setCachedTemplates } = useMandrillStore();

  // Get cached templates immediately for instant render
  const cachedTemplates = getCachedTemplates();

  const { data, error, isLoading, mutate: refresh } = useSWR<MandrillTemplate[]>(
    'templates',
    fetcher,
    {
      // Use cached data as fallback for instant rendering
      fallbackData: cachedTemplates || undefined,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // Prevent duplicate requests within 5s
      refreshInterval: 30000, // Auto-refresh every 30s, but show cached first
    }
  );

  // Update IndexedDB cache whenever we get fresh data
  useEffect(() => {
    if (data && data.length > 0) {
      setCachedTemplates(data);
    }
  }, [data, setCachedTemplates]);

  return {
    templates: data || [],
    error,
    loading: isLoading && !cachedTemplates, // Not loading if we have cached data
    refresh, // Manual refresh function
  };
}

// Hook to fetch a single template with caching
export function useTemplate(slug: string | null) {
  const { data, error, isLoading, mutate: refresh } = useSWR<MandrillTemplateInfo>(
    slug ? `template-${slug}` : null,
    slug ? () => templateFetcher(slug) : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  return {
    template: data || null,
    error,
    loading: isLoading,
    refresh,
  };
}

// Mutation functions with cache invalidation
export async function createTemplate(
  name: string,
  code: string,
  subject: string,
  fromEmail: string,
  fromName: string,
  text: string,
  labels: string[]
) {
  if (!mandrillClient.isInitialized()) {
    throw new Error('Mandrill client not initialized');
  }

  // Perform the actual create via Mandrill API
  const newTemplate = await mandrillClient.addTemplate(
    name,
    code,
    subject,
    fromEmail,
    fromName,
    text,
    labels
  );

  // Update SWR cache with the new template in sorted position
  await mutate(
    'templates',
    (currentData: MandrillTemplate[] | undefined) => {
      if (!currentData) return [newTemplate];

      // Add new template and sort immediately
      const updatedData = [...currentData, newTemplate];

      // Sort by name (same as tree default sorting)
      const sorted = updatedData.sort((a, b) => a.name.localeCompare(b.name));

      // Update IndexedDB cache too
      useMandrillStore.getState().setCachedTemplates(sorted);

      return sorted;
    },
    {
      // Don't revalidate immediately - we have the correct data
      revalidate: false,
    }
  );

  // Trigger a deferred revalidation to ensure consistency
  setTimeout(() => mutate('templates'), 1000);

  return newTemplate;
}

export async function updateTemplate(
  slug: string,
  code: string,
  subject: string,
  fromEmail: string,
  fromName: string,
  text: string,
  labels: string[]
) {
  if (!mandrillClient.isInitialized()) {
    throw new Error('Mandrill client not initialized');
  }

  // Perform the update via Mandrill API
  const result = await mandrillClient.updateTemplate(
    slug,
    code,
    subject,
    fromEmail,
    fromName,
    text,
    labels
  );

  // Invalidate caches
  await mutate('templates');
  await mutate(`template-${slug}`);

  return result;
}

export async function deleteTemplate(slug: string) {
  if (!mandrillClient.isInitialized()) {
    throw new Error('Mandrill client not initialized');
  }

  // Perform the actual delete via Mandrill API
  const result = await mandrillClient.deleteTemplate(slug);

  // Optimistically update cache to remove deleted template immediately
  await mutate(
    'templates',
    (currentData: MandrillTemplate[] | undefined) => {
      const filtered = currentData ? currentData.filter(t => t.slug !== slug) : [];

      // Update IndexedDB cache too
      useMandrillStore.getState().setCachedTemplates(filtered);

      return filtered;
    },
    {
      // Don't revalidate immediately - use the optimistic update
      revalidate: false,
    }
  );

  // Schedule a delayed revalidation to sync with Mandrill after delete propagates
  // This prevents auto-refresh from bringing back the deleted template
  setTimeout(() => {
    mutate('templates');
  }, 2000);

  return result;
}
