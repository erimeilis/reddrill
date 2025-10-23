import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { IconUpload } from '@tabler/icons-react';
import { ImportPreview } from './import-preview';
import type { TemplateExportData } from '@/lib/utils/template-export';
import { validateImportData } from '@/lib/utils/template-import';

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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset input for same file selection
    event.target.value = '';

    try {
      // Read file
      const text = await file.text();

      // Parse JSON
      let jsonData: unknown;
      try {
        jsonData = JSON.parse(text);
      } catch (error) {
        alert('Invalid JSON file: The selected file is not a valid JSON file.');
        return;
      }

      // Validate
      const validation = validateImportData(jsonData);

      if (!validation.valid) {
        const errorMessages = validation.errors.slice(0, 3).map(err => err.message).join('\n');
        const extraCount = validation.errors.length > 3 ? `\n...and ${validation.errors.length - 3} more errors` : '';
        alert(`Validation failed:\n\n${errorMessages}${extraCount}`);
        return;
      }

      // Show preview
      setPreviewData(validation.data!);
      setValidationWarnings(validation.warnings);
      setIsPreviewOpen(true);

    } catch (error) {
      console.error('Import file read error:', error);
      alert(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData) return;

    setIsImporting(true);
    try {
      await onImport(previewData);

      // Success
      alert(`Successfully imported ${previewData.templates.length} templates`);

      setIsPreviewOpen(false);
      setPreviewData(null);
    } catch (error) {
      console.error('Import error:', error);
      alert(`Import failed: ${error instanceof Error ? error.message : 'Failed to import templates'}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
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
        Import
      </Button>

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
    </>
  );
}
