import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { IconUpload, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { ImportPreview } from './import-preview';
import type { TemplateExportData } from '@/lib/utils/template-export';
import { validateImportData } from '@/lib/utils/template-import';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImportButtonProps {
  currentTemplateCount: number;
  onImport: (data: TemplateExportData) => Promise<void>;
  disabled?: boolean;
}

export function ImportButton({ currentTemplateCount, onImport, disabled }: ImportButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewData, setPreviewData] = useState<TemplateExportData | null>(null);
  const [validationWarnings, setValidationWarnings] = useState<any[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input for same file selection
    event.target.value = '';
    setMessage(null);

    try {
      // Read file
      const text = await file.text();

      // Parse JSON
      let jsonData: unknown;
      try {
        jsonData = JSON.parse(text);
      } catch (error) {
        setMessage({ type: 'error', text: 'Invalid JSON file: The selected file is not a valid JSON file.' });
        return;
      }

      // Validate
      const validation = validateImportData(jsonData);

      if (!validation.valid) {
        const errorMessages = validation.errors.slice(0, 3).map(err => err.message).join(', ');
        const extraCount = validation.errors.length > 3 ? ` ...and ${validation.errors.length - 3} more errors` : '';
        setMessage({ type: 'error', text: `Validation failed: ${errorMessages}${extraCount}` });
        return;
      }

      // Show preview
      setPreviewData(validation.data!);
      setValidationWarnings(validation.warnings);
      setIsPreviewOpen(true);

    } catch (error) {
      console.error('Import file read error:', error);
      setMessage({ type: 'error', text: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData) return;

    setIsImporting(true);
    setMessage(null);

    try {
      await onImport(previewData);

      // Success
      setMessage({ type: 'success', text: `Successfully imported ${previewData.templates.length} template${previewData.templates.length === 1 ? '' : 's'}` });

      setIsPreviewOpen(false);
      setPreviewData(null);

      // Auto-clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Import error:', error);
      setMessage({ type: 'error', text: `Import failed: ${error instanceof Error ? error.message : 'Failed to import templates'}` });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isImporting}
      >
        <IconUpload className="h-4 w-4 mr-2" />
        {isImporting ? 'Importing...' : 'Import'}
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

      {previewData && (
        <ImportPreview
          open={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            setPreviewData(null);
          }}
          onConfirm={handleConfirmImport}
          data={previewData}
          currentTemplateCount={currentTemplateCount}
          warnings={validationWarnings}
        />
      )}
    </div>
  );
}
