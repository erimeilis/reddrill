import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react';
import type { TemplateExportData } from '@/lib/utils/template-export';
import type { ValidationError } from '@/lib/utils/template-import';
import { parseTemplateName } from '@/lib/utils/template-parser';
import { getLocaleFlag } from '@/lib/constants/locales';

interface ImportPreviewProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  data: TemplateExportData;
  currentTemplateCount: number;
  warnings: ValidationError[];
}

export function ImportPreview({
  open,
  onClose,
  onConfirm,
  data,
  currentTemplateCount,
  warnings,
}: ImportPreviewProps) {
  const [confirmText, setConfirmText] = useState('');
  const requiredConfirmText = 'DELETE ALL';

  const isConfirmValid = confirmText === requiredConfirmText;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Templates - Preview</DialogTitle>
          <DialogDescription>
            Review the data to be imported and confirm the operation
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto flex flex-col gap-4 py-4">
          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-4">
              <div className="flex items-start gap-2">
                <IconInfoCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100">Warnings</h4>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-blue-800 dark:text-blue-200">
                    {warnings.map((warning, i) => (
                      <li key={i}>{warning.message}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Danger Warning */}
          <div className="bg-red-50 dark:bg-red-950 border-2 border-red-500 dark:border-red-700 rounded-md p-4">
            <div className="flex items-start gap-2">
              <IconAlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-red-900 dark:text-red-100">⚠️ WARNING: Destructive Operation</h4>
                <p className="font-semibold mt-2 text-red-900 dark:text-red-100">
                  ALL EXISTING TEMPLATES WILL BE PERMANENTLY DELETED!
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-red-800 dark:text-red-200">
                  <li>Current templates: <strong>{currentTemplateCount}</strong> will be deleted</li>
                  <li>New templates: <strong>{data.templates.length}</strong> will be created</li>
                  <li>This action cannot be undone</li>
                  <li>Make sure you have a backup before proceeding</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Import Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg bg-secondary/10">
              <div className="text-3xl font-bold text-primary">{data.templates.length}</div>
              <div className="text-sm text-muted-foreground mt-1">Templates</div>
            </div>
            <div className="p-4 border rounded-lg bg-secondary/10">
              <div className="text-3xl font-bold text-primary">{data.metadata.uniqueLabels.length}</div>
              <div className="text-sm text-muted-foreground mt-1">Unique Labels</div>
            </div>
            <div className="p-4 border rounded-lg bg-secondary/10">
              <div className="text-3xl font-bold text-primary">{data.metadata.locales.length}</div>
              <div className="text-sm text-muted-foreground mt-1">Locales</div>
            </div>
          </div>

          {/* Templates Preview */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-secondary px-4 py-2 font-semibold">
              Templates to Import ({data.templates.length})
            </div>
            <div className="max-h-[200px] overflow-y-auto p-4 space-y-2">
              {data.templates.map((template, index) => {
                const { theme, locale } = parseTemplateName(template.name);
                const flag = locale ? getLocaleFlag(locale) : null;

                return (
                  <div key={index} className="flex items-center gap-2 text-sm py-1">
                    <span className="font-mono text-muted-foreground w-8 text-right">{index + 1}.</span>
                    <span className="font-semibold">{theme}</span>
                    {locale && flag && (
                      <span className="text-lg">{flag}</span>
                    )}
                    <div className="flex gap-1 flex-wrap">
                      {template.labels.map(label => (
                        <span
                          key={label}
                          className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Metadata Preview */}
          {data.metadata.uniqueLabels.length > 0 && (
            <div className="border rounded-lg p-4">
              <div className="font-semibold mb-2">Labels</div>
              <div className="flex flex-wrap gap-2">
                {data.metadata.uniqueLabels.map(label => (
                  <span
                    key={label}
                    className="px-3 py-1 text-sm rounded-md border bg-background"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Confirmation Input */}
          <div className="border-t pt-4">
            <label className="block text-sm font-semibold mb-2">
              Type <code className="bg-muted px-2 py-1 rounded">{requiredConfirmText}</code> to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={requiredConfirmText}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={!isConfirmValid}
          >
            Delete All & Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
