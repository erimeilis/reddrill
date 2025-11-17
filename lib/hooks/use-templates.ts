import { useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import mandrillClient, { type MandrillTemplate, type MandrillTemplateInfo } from '@/lib/api/mandrill';
import { useMandrillStore } from '@/lib/store/useMandrillStore';
import type { AuditLogEntry } from '@/lib/types/audit';

// Helper to get API key for audit logging
function getApiKeyForAudit(): string | null {
  return useMandrillStore.getState().apiKey;
}

// Fetcher function that uses API route to avoid CORS
const fetcher = async () => {
  const apiKey = useMandrillStore.getState().apiKey;

  if (!apiKey) {
    throw new Error('Mandrill client not initialized');
  }

  const response = await fetch('/api/mandrill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey,
      action: 'listTemplates'
    })
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to fetch templates');
  }

  return result.templates;
};

const templateFetcher = async (slug: string) => {
  const apiKey = useMandrillStore.getState().apiKey;

  if (!apiKey) {
    throw new Error('Mandrill client not initialized');
  }

  const response = await fetch('/api/mandrill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey,
      action: 'getTemplateInfo',
      templateName: slug
    })
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to fetch template info');
  }

  return result.template;
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
  const apiKey = useMandrillStore.getState().apiKey;

  if (!apiKey) {
    throw new Error('Mandrill client not initialized');
  }

  // Perform the actual create via API route
  const response = await fetch('/api/mandrill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey,
      action: 'addTemplate',
      name,
      code,
      subject,
      from_email: fromEmail,
      from_name: fromName,
      text,
      labels
    })
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to create template');
  }

  const newTemplate = result.template;

  // Log audit trail
  try {
    const apiKey = getApiKeyForAudit();
    if (apiKey) {
      await fetch('/api/audit/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          operationType: 'create',
          templateName: name,
          templateSlug: newTemplate.slug,
          stateAfter: newTemplate,
          operationStatus: 'success',
        } as AuditLogEntry),
      });
    }
  } catch (error) {
    console.error('Failed to log audit trail:', error);
  }

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
  const apiKey = useMandrillStore.getState().apiKey;

  if (!apiKey) {
    throw new Error('Mandrill client not initialized');
  }

  // Get current state before update for audit trail
  let stateBefore: MandrillTemplateInfo | null = null;
  try {
    const infoResponse = await fetch('/api/mandrill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey,
        action: 'getTemplateInfo',
        templateName: slug
      })
    });

    const infoResult = await infoResponse.json();

    if (infoResponse.ok && infoResult.success) {
      stateBefore = infoResult.template;
    }
  } catch (error) {
    console.error('Failed to fetch template before state:', error);
  }

  // Perform the update via API route
  const response = await fetch('/api/mandrill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey,
      action: 'updateTemplate',
      name: slug,
      code,
      subject,
      from_email: fromEmail,
      from_name: fromName,
      text,
      labels
    })
  });

  const updateResult = await response.json();

  if (!response.ok || !updateResult.success) {
    throw new Error(updateResult.error || 'Failed to update template');
  }

  const result = updateResult.template;

  // Log audit trail
  if (stateBefore) {
    try {
      // Calculate changes
      const changes = [];
      if (stateBefore.code !== result.code) {
        changes.push({ field: 'code', oldValue: stateBefore.code, newValue: result.code });
      }
      if (stateBefore.subject !== result.subject) {
        changes.push({ field: 'subject', oldValue: stateBefore.subject, newValue: result.subject });
      }
      if (stateBefore.from_email !== result.from_email) {
        changes.push({ field: 'from_email', oldValue: stateBefore.from_email, newValue: result.from_email });
      }
      if (stateBefore.from_name !== result.from_name) {
        changes.push({ field: 'from_name', oldValue: stateBefore.from_name, newValue: result.from_name });
      }
      if (stateBefore.text !== result.text) {
        changes.push({ field: 'text', oldValue: stateBefore.text, newValue: result.text });
      }
      if (JSON.stringify(stateBefore.labels) !== JSON.stringify(result.labels)) {
        changes.push({ field: 'labels', oldValue: stateBefore.labels, newValue: result.labels });
      }

      const apiKey = getApiKeyForAudit();
      if (apiKey) {
        await fetch('/api/audit/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey,
          },
          body: JSON.stringify({
            operationType: 'update',
            templateName: result.name,
            templateSlug: result.slug,
            stateBefore,
            stateAfter: result,
            changesSummary: changes.length > 0 ? changes : null,
            operationStatus: 'success',
          } as AuditLogEntry),
        });
      }
    } catch (error) {
      console.error('Failed to log audit trail:', error);
    }
  }

  // Invalidate caches
  await mutate('templates');
  await mutate(`template-${slug}`);

  return result;
}

export async function deleteTemplate(slug: string) {
  const apiKey = useMandrillStore.getState().apiKey;

  if (!apiKey) {
    throw new Error('Mandrill client not initialized');
  }

  // Get current state before delete for audit trail
  let stateBefore: MandrillTemplateInfo | null = null;
  try {
    const infoResponse = await fetch('/api/mandrill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey,
        action: 'getTemplateInfo',
        templateName: slug
      })
    });

    const infoResult = await infoResponse.json();

    if (infoResponse.ok && infoResult.success) {
      stateBefore = infoResult.template;
    }
  } catch (error) {
    console.error('Failed to fetch template before state:', error);
  }

  // Perform the actual delete via API route
  const response = await fetch('/api/mandrill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey,
      action: 'deleteTemplate',
      name: slug
    })
  });

  const deleteResult = await response.json();

  if (!response.ok || !deleteResult.success) {
    throw new Error(deleteResult.error || 'Failed to delete template');
  }

  const result = deleteResult.template;

  // Log audit trail
  if (stateBefore) {
    try {
      const apiKey = getApiKeyForAudit();
      if (apiKey) {
        await fetch('/api/audit/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey,
          },
          body: JSON.stringify({
            operationType: 'delete',
            templateName: stateBefore.name,
            templateSlug: stateBefore.slug,
            stateBefore,
            operationStatus: 'success',
          } as AuditLogEntry),
        });
      }
    } catch (error) {
      console.error('Failed to log audit trail:', error);
    }
  }

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
