'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { type TemplatePlaceholder } from '@/lib/utils/placeholder-parser';
import { IconInfoCircle } from '@tabler/icons-react';

interface PlaceholderListProps {
  placeholders: TemplatePlaceholder[];
}

const formatBadgeVariant = (format: TemplatePlaceholder['format']) => {
  switch (format) {
    case 'mailchimp':
      return 'default';
    case 'handlebars':
      return 'secondary';
    case 'global':
      return 'outline';
    case 'conditional':
      return 'destructive';
    default:
      return 'default';
  }
};

const formatLabel = (format: TemplatePlaceholder['format']) => {
  switch (format) {
    case 'mailchimp':
      return 'Mailchimp';
    case 'handlebars':
      return 'Handlebars';
    case 'global':
      return 'Global';
    case 'conditional':
      return 'Conditional';
    default:
      return format;
  }
};

const fieldLabel = (
  field: 'code' | 'text' | 'subject' | 'from_name' | 'from_email' |
         'publish_code' | 'publish_text' | 'publish_subject' | 'publish_from_name' | 'publish_from_email'
) => {
  const labels: Record<string, string> = {
    code: 'HTML (Draft)',
    text: 'Text (Draft)',
    subject: 'Subject (Draft)',
    from_name: 'From Name (Draft)',
    from_email: 'From Email (Draft)',
    publish_code: 'HTML (Published)',
    publish_text: 'Text (Published)',
    publish_subject: 'Subject (Published)',
    publish_from_name: 'From Name (Published)',
    publish_from_email: 'From Email (Published)',
  };
  return labels[field] || field;
};

export function PlaceholderList({ placeholders }: PlaceholderListProps) {
  if (placeholders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Placeholders</CardTitle>
          <CardDescription>
            No dynamic placeholders detected in this template
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Group by format
  const grouped = placeholders.reduce((acc, placeholder) => {
    if (!acc[placeholder.format]) {
      acc[placeholder.format] = [];
    }
    acc[placeholder.format].push(placeholder);
    return acc;
  }, {} as Record<TemplatePlaceholder['format'], TemplatePlaceholder[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Placeholders
          <Badge variant="outline">{placeholders.length}</Badge>
        </CardTitle>
        <CardDescription>
          Dynamic content variables detected in this template
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(grouped).map(([format, items]) => (
          <div key={format} className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={formatBadgeVariant(format as TemplatePlaceholder['format'])}>
                {formatLabel(format as TemplatePlaceholder['format'])}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {items.length} variable{items.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-2">
              {items.map((placeholder) => {
                const totalOccurrences = placeholder.locations.reduce(
                  (sum, loc) => sum + loc.count,
                  0
                );

                return (
                  <div
                    key={`${placeholder.format}-${placeholder.name}`}
                    className="rounded-lg border p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          {placeholder.locations[0]?.examples[0] || placeholder.name}
                        </code>
                        <Badge variant="secondary" className="text-xs">
                          {totalOccurrences} occurrence{totalOccurrences !== 1 ? 's' : ''}
                        </Badge>
                      </div>

                      {placeholder.description && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <IconInfoCircle className="h-4 w-4 text-muted-foreground cursor-help" stroke={1.5} />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{placeholder.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>

                    {placeholder.locations.length > 0 && (
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="font-medium">Used in:</div>
                        <div className="flex flex-wrap gap-1">
                          {placeholder.locations.map((location) => (
                            <Badge
                              key={location.field}
                              variant="outline"
                              className="text-xs font-normal"
                            >
                              {fieldLabel(location.field)} ({location.count})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
