'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TestDataForm, type TestData } from '@/components/templates/test-data-form';
import { TemplatePreview } from '@/components/templates/template-preview';
import { Button } from '@/components/ui/button';
import { IconLoader, IconTestPipe, IconMail } from '@tabler/icons-react';
import { SendTestDialog } from '@/components/templates/send-test-dialog';
import { TestScenarioSelector } from '@/components/templates/test-scenario-selector';
import mandrillClient from '@/lib/api/mandrill';
import type { MandrillTemplateInfo } from '@/lib/api/mandrill';

export default function TemplateTestPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [template, setTemplate] = useState<MandrillTemplateInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testData, setTestData] = useState<TestData>({
    mergeVars: {},
    globalVars: {},
  });
  const [sendDialogOpen, setSendDialogOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const loadTemplate = async () => {
      setLoading(true);
      setError(null);
      try {
        const templateInfo = await mandrillClient.getTemplateInfo(slug);
        setTemplate(templateInfo);
      } catch (err) {
        console.error('Error loading template:', err);
        setError(err instanceof Error ? err.message : 'Failed to load template');
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [slug]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-muted-foreground">
              <IconLoader className="h-5 w-5 animate-spin" stroke={1.5} />
              <span>Loading template...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              {error || 'Template not found'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <IconTestPipe size={28} stroke={1.5} className="text-primary" />
            <h1 className="text-2xl font-bold">Template Testing</h1>
          </div>
          <Button onClick={() => setSendDialogOpen(true)} className="gap-2">
            <IconMail size={18} stroke={1.5} />
            Send Test Email
          </Button>
        </div>
        <p className="text-muted-foreground">
          Test <span className="font-mono font-medium">{template.name}</span> with dynamic data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Test Data Form */}
        <div className="space-y-6">
          <div className="flex justify-end">
            <TestScenarioSelector
              templateSlug={slug}
              currentData={testData}
              onLoadScenario={setTestData}
            />
          </div>
          <TestDataForm
            template={template}
            value={testData}
            onChange={setTestData}
          />
        </div>

        {/* Right column: Preview */}
        <div className="space-y-6">
          <TemplatePreview
            template={template}
            testData={testData}
          />
        </div>
      </div>

      <SendTestDialog
        isOpen={sendDialogOpen}
        onClose={() => setSendDialogOpen(false)}
        templateSlug={slug}
        testData={testData}
      />
    </div>
  );
}
