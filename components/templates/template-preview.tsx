'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { substitutePlaceholders } from '@/lib/utils/placeholder-parser';
import { IconDeviceDesktop, IconDeviceMobile, IconMoon, IconSun } from '@tabler/icons-react';

export interface RenderedTemplate {
  subject: string;
  fromName: string;
  fromEmail: string;
  htmlContent: string;
  textContent: string;
}

interface TemplatePreviewProps {
  template: {
    code?: string;
    text?: string;
    subject?: string;
    from_name?: string;
    from_email?: string;
  };
  testData: {
    mergeVars: Record<string, string>;
    globalVars: Record<string, string>;
  };
}

export function TemplatePreview({ template, testData }: TemplatePreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [darkMode, setDarkMode] = useState(false);
  const [rendered, setRendered] = useState<RenderedTemplate | null>(null);

  useEffect(() => {
    // Render template with test data
    const subject = substitutePlaceholders(
      template.subject || '',
      testData.mergeVars,
      testData.globalVars
    );
    const fromName = substitutePlaceholders(
      template.from_name || '',
      testData.mergeVars,
      testData.globalVars
    );
    const fromEmail = substitutePlaceholders(
      template.from_email || '',
      testData.mergeVars,
      testData.globalVars
    );
    const htmlContent = substitutePlaceholders(
      template.code || '',
      testData.mergeVars,
      testData.globalVars
    );
    const textContent = substitutePlaceholders(
      template.text || '',
      testData.mergeVars,
      testData.globalVars
    );

    setRendered({
      subject,
      fromName,
      fromEmail,
      htmlContent,
      textContent,
    });
  }, [template, testData]);

  if (!rendered) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>Loading preview...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Preview</CardTitle>
            <CardDescription>Template rendered with test data</CardDescription>
          </div>
          <div className="flex gap-2">
            {/* View mode toggle */}
            <div className="flex gap-px bg-secondary/50 rounded-lg p-px">
              <Button
                variant={viewMode === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('desktop')}
                title="Desktop View"
              >
                <IconDeviceDesktop size={16} stroke={1.5} />
              </Button>
              <Button
                variant={viewMode === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('mobile')}
                title="Mobile View"
              >
                <IconDeviceMobile size={16} stroke={1.5} />
              </Button>
            </div>

            {/* Dark mode toggle */}
            <Button
              variant={darkMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'Light Mode' : 'Dark Mode'}
            >
              {darkMode ? (
                <IconSun size={16} stroke={1.5} />
              ) : (
                <IconMoon size={16} stroke={1.5} />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <Tabs defaultValue="html" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="html">HTML</TabsTrigger>
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="subject">Subject</TabsTrigger>
            <TabsTrigger value="full">Full Email</TabsTrigger>
          </TabsList>

          <TabsContent value="html" className="flex-1 mt-4 overflow-hidden">
            <div
              className={`border rounded-lg overflow-auto h-full transition-all ${
                darkMode ? 'bg-gray-900' : 'bg-white'
              }`}
              style={{
                maxWidth: viewMode === 'mobile' ? '375px' : '100%',
                margin: viewMode === 'mobile' ? '0 auto' : '0',
              }}
            >
              <iframe
                className="w-full h-full border-0"
                srcDoc={
                  darkMode
                    ? `<body style="background-color: #1a1a1a; color: #e5e5e5; margin: 0;">${rendered.htmlContent}</body>`
                    : rendered.htmlContent
                }
                title="Email Preview"
                sandbox="allow-same-origin"
              />
            </div>
          </TabsContent>

          <TabsContent value="text" className="flex-1 mt-4 overflow-hidden">
            <div className="border rounded-lg p-4 bg-muted h-full overflow-auto">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {rendered.textContent || 'No text version available'}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="subject" className="flex-1 mt-4 overflow-hidden">
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-muted">
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Subject
                    </div>
                    <div className="text-base font-semibold">{rendered.subject}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        From Name
                      </div>
                      <div className="text-sm">{rendered.fromName}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        From Email
                      </div>
                      <div className="text-sm font-mono">{rendered.fromEmail}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="full" className="flex-1 mt-4 overflow-hidden">
            <div className="space-y-4 h-full flex flex-col">
              {/* Email Header */}
              <div className="border rounded-lg p-4 bg-muted">
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-medium text-muted-foreground">From:</span>
                    <span className="text-sm">
                      {rendered.fromName} &lt;{rendered.fromEmail}&gt;
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Subject:</span>
                    <span className="text-sm font-semibold">{rendered.subject}</span>
                  </div>
                </div>
              </div>

              {/* Email Body */}
              <div
                className={`flex-1 border rounded-lg overflow-auto transition-all ${
                  darkMode ? 'bg-gray-900' : 'bg-white'
                }`}
                style={{
                  maxWidth: viewMode === 'mobile' ? '375px' : '100%',
                  margin: viewMode === 'mobile' ? '0 auto' : '0',
                }}
              >
                <iframe
                  className="w-full h-full border-0"
                  srcDoc={rendered.htmlContent}
                  title="Full Email Preview"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
