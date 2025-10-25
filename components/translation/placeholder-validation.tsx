'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type PlaceholderValidation } from '@/lib/utils/placeholder-parser';
import { IconAlertCircle, IconAlertTriangle, IconCircleCheck, IconCircleX } from '@tabler/icons-react';

interface PlaceholderValidationProps {
  validation: PlaceholderValidation;
}

export function PlaceholderValidationDisplay({ validation }: PlaceholderValidationProps) {
  if (validation.isValid) {
    return (
      <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
        <IconCircleCheck className="h-4 w-4 text-green-600 dark:text-green-400" stroke={1.5} />
        <AlertTitle className="text-green-800 dark:text-green-200">
          All placeholders preserved
        </AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-300">
          Translation completed successfully with all placeholders intact.
        </AlertDescription>
      </Alert>
    );
  }

  const hasCriticalIssues = validation.corrupted.length > 0 || validation.missing.length > 0;

  return (
    <div className="space-y-4">
      <Alert
        variant={hasCriticalIssues ? 'destructive' : 'default'}
        className={hasCriticalIssues ? '' : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'}
      >
        {hasCriticalIssues ? (
          <IconCircleX className="h-4 w-4" stroke={1.5} />
        ) : (
          <IconAlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" stroke={1.5} />
        )}
        <AlertTitle
          className={hasCriticalIssues ? '' : 'text-yellow-800 dark:text-yellow-200'}
        >
          Placeholder validation {hasCriticalIssues ? 'failed' : 'warnings'}
        </AlertTitle>
        <AlertDescription
          className={hasCriticalIssues ? '' : 'text-yellow-700 dark:text-yellow-300'}
        >
          {hasCriticalIssues
            ? 'Critical issues detected with placeholders in the translation.'
            : 'Some placeholder differences were detected. Please review before using the translation.'}
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Validation Details</CardTitle>
          <CardDescription>
            Review the placeholder differences below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {validation.missing.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <IconCircleX className="h-4 w-4 text-destructive" stroke={1.5} />
                <h4 className="font-medium text-sm">Missing Placeholders</h4>
                <Badge variant="destructive">{validation.missing.length}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                These placeholders were in the original but not found in the translation:
              </p>
              <div className="flex flex-wrap gap-2">
                {validation.missing.map((placeholder, index) => (
                  <code
                    key={index}
                    className="px-2 py-1 bg-destructive/10 text-destructive rounded text-xs font-mono"
                  >
                    {placeholder}
                  </code>
                ))}
              </div>
            </div>
          )}

          {validation.added.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <IconAlertCircle className="h-4 w-4 text-yellow-600" stroke={1.5} />
                <h4 className="font-medium text-sm">Added Placeholders</h4>
                <Badge variant="outline" className="bg-yellow-50">
                  {validation.added.length}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                These placeholders appeared in the translation but weren't in the original:
              </p>
              <div className="flex flex-wrap gap-2">
                {validation.added.map((placeholder, index) => (
                  <code
                    key={index}
                    className="px-2 py-1 bg-yellow-50 text-yellow-800 rounded text-xs font-mono"
                  >
                    {placeholder}
                  </code>
                ))}
              </div>
            </div>
          )}

          {validation.corrupted.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <IconCircleX className="h-4 w-4 text-destructive" stroke={1.5} />
                <h4 className="font-medium text-sm">Corrupted Syntax</h4>
                <Badge variant="destructive">{validation.corrupted.length}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                These placeholder-like patterns have invalid syntax:
              </p>
              <div className="flex flex-wrap gap-2">
                {validation.corrupted.map((placeholder, index) => (
                  <code
                    key={index}
                    className="px-2 py-1 bg-destructive/10 text-destructive rounded text-xs font-mono"
                  >
                    {placeholder}
                  </code>
                ))}
              </div>
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <h4 className="font-medium text-sm mb-2">Warnings</h4>
              <ul className="text-sm space-y-1">
                {validation.warnings.map((warning, index) => (
                  <li key={index} className="text-muted-foreground">
                    • {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
