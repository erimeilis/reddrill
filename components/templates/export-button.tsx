import { Button } from '@/components/ui/button';
import { IconDownload } from '@tabler/icons-react';
import { MandrillTemplate } from '@/lib/api/mandrill';
import { exportTemplates } from '@/lib/utils/template-export';

interface ExportButtonProps {
  templates: MandrillTemplate[];
  disabled?: boolean;
}

export function ExportButton({ templates, disabled }: ExportButtonProps) {
  const handleExport = async () => {
    try {
      if (!templates || templates.length === 0) {
        alert('No templates to export');
        return;
      }

      await exportTemplates(templates);

      // Success feedback
      console.log(`Successfully exported ${templates.length} templates`);
    } catch (error) {
      console.error('Export error:', error);
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={disabled || !templates || templates.length === 0}
    >
      <IconDownload className="h-4 w-4 mr-2" />
      Export
    </Button>
  );
}
