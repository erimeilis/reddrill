import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { IconDownload, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { MandrillTemplate } from '@/lib/api/mandrill';
import { exportTemplates } from '@/lib/utils/template-export';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ExportButtonProps {
  templates: MandrillTemplate[];
  disabled?: boolean;
}

export function ExportButton({ templates, disabled }: ExportButtonProps) {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!templates || templates.length === 0) {
      setMessage({ type: 'error', text: 'No templates to export' });
      return;
    }

    setExporting(true);
    setMessage(null);

    try {
      await exportTemplates(templates);
      setMessage({ type: 'success', text: `Successfully exported ${templates.length} template${templates.length === 1 ? '' : 's'}` });

      // Auto-clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Export error:', error);
      setMessage({
        type: 'error',
        text: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={disabled || exporting || !templates || templates.length === 0}
      >
        {exporting ? (
          <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <IconDownload className="h-4 w-4 mr-2" />
        )}
        {exporting ? 'Exporting...' : 'Export'}
      </Button>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="py-2">
          {message.type === 'success' ? (
            <IconCheck className="h-4 w-4" />
          ) : (
            <IconAlertCircle className="h-4 w-4" />
          )}
          <AlertDescription className="text-sm">{message.text}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
