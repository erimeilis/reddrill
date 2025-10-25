'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { extractUniquePlaceholders, STANDARD_PLACEHOLDERS, type TemplatePlaceholder } from '@/lib/utils/placeholder-parser';
import { IconRefresh, IconDeviceFloppy } from '@tabler/icons-react';

export interface TestData {
  mergeVars: Record<string, string>;
  globalVars: Record<string, string>;
}

interface TestDataFormProps {
  template: {
    code?: string;
    text?: string;
    subject?: string;
    from_name?: string;
    from_email?: string;
    publish_code?: string;
    publish_text?: string;
    publish_subject?: string;
    publish_from_name?: string;
    publish_from_email?: string;
  };
  value: TestData;
  onChange: (data: TestData) => void;
  onSave?: (name: string, data: TestData) => void;
}

// Example values for common placeholders
const EXAMPLE_VALUES: Record<string, string> = {
  'FNAME': 'John',
  'LNAME': 'Doe',
  'EMAIL': 'john.doe@example.com',
  'COMPANY': 'Acme Inc.',
  'PHONE': '+1 (555) 123-4567',
  'ADDRESS': '123 Main St',
  'CITY': 'San Francisco',
  'STATE': 'CA',
  'ZIP': '94102',
  'COUNTRY': 'United States',
  'CURRENT_YEAR': new Date().getFullYear().toString(),
  'UNSUBSCRIBE': 'https://example.com/unsubscribe',
  'LIST_UNSUBSCRIBE': 'mailto:unsubscribe@example.com',
  'SUBJECT': 'Welcome to our service',
  'MC_PREVIEW_TEXT': 'Preview text for your inbox',
};

export function TestDataForm({ template, value, onChange, onSave }: TestDataFormProps) {
  const [placeholders, setPlaceholders] = useState<TemplatePlaceholder[]>([]);
  const [scenarioName, setScenarioName] = useState('');

  useEffect(() => {
    const detected = extractUniquePlaceholders(template);
    setPlaceholders(detected);

    // Initialize with example values for detected placeholders
    const initialMergeVars: Record<string, string> = {};
    const initialGlobalVars: Record<string, string> = {};

    detected.forEach(ph => {
      const exampleValue = EXAMPLE_VALUES[ph.name] || EXAMPLE_VALUES[ph.name.toLowerCase()] || '';

      if (ph.format === 'global') {
        initialGlobalVars[ph.name] = exampleValue;
      } else if (ph.format !== 'conditional') {
        initialMergeVars[ph.name] = exampleValue;
      }
    });

    // Only set initial values if current value is empty
    if (Object.keys(value.mergeVars).length === 0 && Object.keys(initialMergeVars).length > 0) {
      onChange({
        mergeVars: initialMergeVars,
        globalVars: initialGlobalVars,
      });
    }
  }, [template]);

  const handleMergeVarChange = (name: string, newValue: string) => {
    onChange({
      ...value,
      mergeVars: {
        ...value.mergeVars,
        [name]: newValue,
      },
    });
  };

  const handleGlobalVarChange = (name: string, newValue: string) => {
    onChange({
      ...value,
      globalVars: {
        ...value.globalVars,
        [name]: newValue,
      },
    });
  };

  const handleReset = () => {
    const resetMergeVars: Record<string, string> = {};
    const resetGlobalVars: Record<string, string> = {};

    placeholders.forEach(ph => {
      const exampleValue = EXAMPLE_VALUES[ph.name] || EXAMPLE_VALUES[ph.name.toLowerCase()] || '';

      if (ph.format === 'global') {
        resetGlobalVars[ph.name] = exampleValue;
      } else if (ph.format !== 'conditional') {
        resetMergeVars[ph.name] = exampleValue;
      }
    });

    onChange({
      mergeVars: resetMergeVars,
      globalVars: resetGlobalVars,
    });
  };

  const handleSave = () => {
    if (onSave && scenarioName.trim()) {
      onSave(scenarioName.trim(), value);
      setScenarioName('');
    }
  };

  // Filter out conditionals for now (they don't need values)
  const mergePlaceholders = placeholders.filter(
    ph => ph.format !== 'global' && ph.format !== 'conditional'
  );
  const globalPlaceholders = placeholders.filter(ph => ph.format === 'global');

  if (placeholders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Test Data</CardTitle>
          <CardDescription>
            No placeholders detected in this template
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Test Data</CardTitle>
            <CardDescription>
              {placeholders.length} placeholder{placeholders.length !== 1 ? 's' : ''} detected
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            title="Reset to example values"
          >
            <IconRefresh size={16} className="mr-2" stroke={1.5} />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Merge Variables */}
        {mergePlaceholders.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Merge Variables</h4>
            <div className="grid gap-3">
              {mergePlaceholders.map((placeholder) => (
                <div key={placeholder.name} className="space-y-1.5">
                  <Label htmlFor={`merge-${placeholder.name}`} className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {placeholder.locations[0]?.examples[0] || placeholder.name}
                    </code>
                    {placeholder.description && (
                      <span className="text-xs text-muted-foreground">
                        {placeholder.description}
                      </span>
                    )}
                  </Label>
                  <Input
                    id={`merge-${placeholder.name}`}
                    value={value.mergeVars[placeholder.name] || ''}
                    onChange={(e) => handleMergeVarChange(placeholder.name, e.target.value)}
                    placeholder={EXAMPLE_VALUES[placeholder.name] || `Enter ${placeholder.name}`}
                    className="font-mono text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Global Variables */}
        {globalPlaceholders.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Global Variables</h4>
            <div className="grid gap-3">
              {globalPlaceholders.map((placeholder) => (
                <div key={placeholder.name} className="space-y-1.5">
                  <Label htmlFor={`global-${placeholder.name}`} className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {placeholder.locations[0]?.examples[0] || placeholder.name}
                    </code>
                    {placeholder.description && (
                      <span className="text-xs text-muted-foreground">
                        {placeholder.description}
                      </span>
                    )}
                  </Label>
                  <Input
                    id={`global-${placeholder.name}`}
                    value={value.globalVars[placeholder.name] || ''}
                    onChange={(e) => handleGlobalVarChange(placeholder.name, e.target.value)}
                    placeholder={EXAMPLE_VALUES[placeholder.name] || `Enter ${placeholder.name}`}
                    className="font-mono text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save Scenario (optional) */}
        {onSave && (
          <div className="border-t pt-4 space-y-3">
            <h4 className="text-sm font-medium">Save Test Scenario</h4>
            <div className="flex gap-2">
              <Input
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                placeholder="Scenario name (e.g., Happy Path, Edge Case)"
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              <Button
                onClick={handleSave}
                disabled={!scenarioName.trim()}
                size="sm"
              >
                <IconDeviceFloppy size={16} className="mr-2" stroke={1.5} />
                Save
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
