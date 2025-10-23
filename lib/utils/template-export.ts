import { MandrillTemplate } from '@/lib/api/mandrill';
import { parseTemplateName } from './template-parser';

export interface TemplateExportData {
  version: '1.0';
  exportedAt: string;
  exportedBy?: string;
  templates: MandrillTemplate[];
  metadata: {
    totalCount: number;
    uniqueLabels: string[];
    locales: string[];
  };
}

/**
 * Generate export data structure from templates
 */
export function generateExportData(
  templates: MandrillTemplate[],
  accountIdentifier?: string
): TemplateExportData {
  // Extract unique labels
  const uniqueLabels = Array.from(
    new Set(templates.flatMap(t => t.labels))
  ).sort();

  // Extract unique locales
  const uniqueLocales = Array.from(
    new Set(
      templates
        .map(t => parseTemplateName(t.name).locale)
        .filter((locale): locale is string => locale !== null)
    )
  ).sort();

  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    exportedBy: accountIdentifier,
    templates: templates,
    metadata: {
      totalCount: templates.length,
      uniqueLabels,
      locales: uniqueLocales,
    },
  };
}

/**
 * Download export data as JSON file
 */
export function downloadExportFile(data: TemplateExportData): void {
  // Convert to formatted JSON
  const jsonString = JSON.stringify(data, null, 2);

  // Create blob
  const blob = new Blob([jsonString], { type: 'application/json' });

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `mandrill-templates-backup-${timestamp}.json`;

  // Create download link and trigger
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export templates to JSON file
 */
export async function exportTemplates(templates: MandrillTemplate[]): Promise<void> {
  const exportData = generateExportData(templates);
  downloadExportFile(exportData);
}
