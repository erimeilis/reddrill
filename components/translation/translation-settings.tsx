'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconCheck, IconAlertCircle, IconExternalLink, IconInfoCircle } from '@tabler/icons-react';
import {
  saveProviderSettings,
  getAllProviders,
  deleteProvider,
  setPrimaryProvider
} from '@/lib/db/translation-settings-db';

type Provider = 'cloudflare' | 'google' | 'azure' | 'crowdin';

interface ProviderConfig {
  provider: Provider;
  apiKey?: string;
  apiEndpoint?: string;
  projectId?: string;
  isPrimary: boolean;
}

export function TranslationSettings() {
  const [provider, setProvider] = useState<Provider>('cloudflare');
  const [apiKey, setApiKey] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [projectId, setProjectId] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load saved providers on mount
  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const savedProviders = await getAllProviders();
      setProviders(savedProviders.map(p => ({
        provider: p.provider as Provider,
        apiKey: p.apiKey,
        apiEndpoint: p.apiEndpoint,
        projectId: (p as any).projectId,
        isPrimary: p.isPrimary
      })));
    } catch (error) {
      console.error('Failed to load providers:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      // Cloudflare doesn't need API key (uses binding)
      if (provider !== 'cloudflare' && !apiKey.trim()) {
        setMessage({ type: 'error', text: 'API key is required for this provider' });
        setLoading(false);
        return;
      }

      // Crowdin requires project ID
      if (provider === 'crowdin' && !projectId.trim()) {
        setMessage({ type: 'error', text: 'Project ID is required for Crowdin' });
        setLoading(false);
        return;
      }

      await saveProviderSettings({
        provider,
        apiKey: provider === 'cloudflare' ? undefined : apiKey,
        apiEndpoint: apiEndpoint || undefined,
        ...(provider === 'crowdin' && { projectId }),
        isPrimary
      } as any);

      setMessage({ type: 'success', text: 'Provider settings saved successfully' });

      // Reset form
      setApiKey('');
      setApiEndpoint('');
      setProjectId('');
      setIsPrimary(false);

      // Reload providers list
      await loadProviders();
    } catch (error) {
      console.error('Failed to save provider:', error);
      setMessage({ type: 'error', text: 'Failed to save provider settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrimary = async (providerName: string) => {
    try {
      await setPrimaryProvider(providerName);
      setMessage({ type: 'success', text: `${providerName} is now the primary provider` });
      await loadProviders();
    } catch (error) {
      console.error('Failed to set primary provider:', error);
      setMessage({ type: 'error', text: 'Failed to set primary provider' });
    }
  };

  const handleDelete = async (providerName: string) => {
    try {
      await deleteProvider(providerName);
      setMessage({ type: 'success', text: 'Provider deleted successfully' });
      await loadProviders();
    } catch (error) {
      console.error('Failed to delete provider:', error);
      setMessage({ type: 'error', text: 'Failed to delete provider' });
    }
  };

  const needsApiKey = provider !== 'cloudflare';

  // Provider-specific information
  const providerInfo = {
    cloudflare: {
      description: 'Free tier: 10,000 neurons/day (~322 translations). Works only when deployed to Cloudflare Workers.',
      setupSteps: null,
      apiKeyLabel: null,
      endpointLabel: null,
      endpointPlaceholder: null,
      endpointDefault: null,
    },
    google: {
      description: 'Google Cloud Translation API v2. Pricing: $20 per 1M characters.',
      setupSteps: [
        'Go to Google Cloud Console',
        'Enable "Cloud Translation API" for your project',
        'Go to APIs & Services → Credentials',
        'Click "Create Credentials" → "API Key"',
        'Copy the generated API key',
        'Restrict the key (recommended): Set "API restrictions" to "Cloud Translation API" only',
      ],
      setupUrl: 'https://console.cloud.google.com/apis/library/translate.googleapis.com',
      apiKeyLabel: 'API Key',
      endpointLabel: 'API Endpoint (optional)',
      endpointPlaceholder: 'https://translation.googleapis.com/language/translate/v2',
      endpointDefault: 'https://translation.googleapis.com/language/translate/v2',
    },
    azure: {
      description: 'Microsoft Azure Translator. Free tier: 2M characters/month. Requires subscription key and region.',
      setupSteps: [
        'Go to Azure Portal',
        'Click "Create a resource" → Search for "Translator"',
        'Select "Translator" and click "Create"',
        'Choose: Subscription, Resource group, Region (e.g., East US)',
        'Pricing tier: F0 (Free) for up to 2M characters/month',
        'After creation, go to resource → "Keys and Endpoint"',
        'Copy "KEY 1" or "KEY 2" (either works)',
        'Note the "Location/Region" (e.g., eastus)',
      ],
      setupUrl: 'https://portal.azure.com/#create/Microsoft.CognitiveServicesTextTranslation',
      apiKeyLabel: 'Subscription Key',
      endpointLabel: 'Region',
      endpointPlaceholder: 'e.g., eastus, westeurope, or global',
      endpointDefault: 'global',
    },
    crowdin: {
      description: 'Crowdin localization platform with machine translation. Paid plans include MT credits.',
      setupSteps: [
        'Sign up or log in to Crowdin',
        'Create or select a project',
        'Go to project Settings → API',
        'Note your Project ID (numeric ID in URL or settings)',
        'Go to Account Settings → API',
        'Click "New Token" to generate a Personal Access Token',
        'Give it a name (e.g., "RedDrill Translation")',
        'Copy the generated token (keep it secure)',
      ],
      setupUrl: 'https://crowdin.com/settings#api-key',
      apiKeyLabel: 'Personal Access Token',
      endpointLabel: null,
      endpointPlaceholder: null,
      endpointDefault: null,
      projectIdLabel: 'Project ID',
      projectIdPlaceholder: 'Enter your Crowdin project ID (numeric)',
    },
  };

  const info = providerInfo[provider];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Translation Provider Settings</CardTitle>
          <CardDescription>
            Configure translation API providers for template localization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Provider Selection */}
          <div className="space-y-2">
            <Label htmlFor="provider">Translation Provider</Label>
            <Select value={provider} onValueChange={(value) => setProvider(value as Provider)}>
              <SelectTrigger id="provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cloudflare">Cloudflare Workers AI (Free)</SelectItem>
                <SelectItem value="google">Google Cloud Translation</SelectItem>
                <SelectItem value="azure">Microsoft Azure Translator</SelectItem>
                <SelectItem value="crowdin">Crowdin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Provider Information */}
          <div className="p-3 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100 rounded-md">
            <div className="flex items-start gap-2">
              <IconInfoCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="text-sm space-y-2 flex-1">
                <p>{info.description}</p>
                {info.setupSteps && (
                  <>
                    <p className="font-semibold mt-3">Setup Instructions:</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      {info.setupSteps.map((step, index) => (
                        <li key={index} className="ml-1">{step}</li>
                      ))}
                    </ol>
                    {info.setupUrl && (
                      <a
                        href={info.setupUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-300 hover:underline font-medium mt-2"
                      >
                        Open {provider === 'google' ? 'Google Cloud Console' : 'Azure Portal'}
                        <IconExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* API Key (not needed for Cloudflare) */}
          {needsApiKey && info.apiKeyLabel && (
            <div className="space-y-2">
              <Label htmlFor="apiKey">{info.apiKeyLabel}</Label>
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`Enter your ${info.apiKeyLabel.toLowerCase()}`}
              />
            </div>
          )}

          {/* API Endpoint/Region */}
          {needsApiKey && info.endpointLabel && (
            <div className="space-y-2">
              <Label htmlFor="apiEndpoint">{info.endpointLabel}</Label>
              <Input
                id="apiEndpoint"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                placeholder={info.endpointPlaceholder || ''}
              />
              {info.endpointDefault && !apiEndpoint && (
                <p className="text-xs text-gray-500">
                  Leave empty to use default: {info.endpointDefault}
                </p>
              )}
            </div>
          )}

          {/* Project ID (Crowdin only) */}
          {provider === 'crowdin' && (info as any).projectIdLabel && (
            <div className="space-y-2">
              <Label htmlFor="projectId">{(info as any).projectIdLabel}</Label>
              <Input
                id="projectId"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder={(info as any).projectIdPlaceholder || ''}
              />
            </div>
          )}

          {/* Primary Provider Checkbox */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPrimary"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="isPrimary" className="cursor-pointer">
              Set as primary provider
            </Label>
          </div>

          {/* Messages */}
          {message && (
            <div className={`flex items-center gap-2 p-3 rounded-md ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message.type === 'success' ? (
                <IconCheck className="h-4 w-4" />
              ) : (
                <IconAlertCircle className="h-4 w-4" />
              )}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          {/* Save Button */}
          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? 'Saving...' : 'Save Provider Settings'}
          </Button>
        </CardContent>
      </Card>

      {/* Configured Providers List */}
      {providers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Configured Providers</CardTitle>
            <CardDescription>
              Manage your active translation providers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {providers.map((p) => (
                <div
                  key={p.provider}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">{p.provider}</span>
                      {p.isPrimary && (
                        <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded">
                          Primary
                        </span>
                      )}
                    </div>
                    {p.apiKey && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        API Key: {p.apiKey.slice(0, 8)}...
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!p.isPrimary && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetPrimary(p.provider)}
                      >
                        Set as Primary
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(p.provider)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
