'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconCheck, IconAlertCircle, IconLoader, IconLanguage } from '@tabler/icons-react';
import { MandrillTemplateInfo } from '@/lib/api/mandrill';
import mandrillClient from '@/lib/api/mandrill';
import { getPrimaryProvider } from '@/lib/db/translation-settings-db';
import { parseTemplateName } from '@/lib/utils/template-parser';
import { createTemplate as createTemplateApi } from '@/lib/hooks/use-templates';
import { PlaceholderValidationDisplay } from '@/components/translation/placeholder-validation';
import { type PlaceholderValidation } from '@/lib/utils/placeholder-parser';
import { extractTranslatableText, reconstructHTML } from '@/lib/utils/html-translator';

interface TranslateTemplateDialogProps {
  template: MandrillTemplateInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onTemplateCreated?: (newTemplateName: string) => void;
}

const LANGUAGE_OPTIONS = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'it', name: 'Italian (Italiano)' },
  { code: 'pt', name: 'Portuguese (Português)' },
  { code: 'ru', name: 'Russian (Русский)' },
  { code: 'ja', name: 'Japanese (日本語)' },
  { code: 'zh', name: 'Chinese (中文)' },
  { code: 'ko', name: 'Korean (한국어)' },
  { code: 'ar', name: 'Arabic (العربية)' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'nb', name: 'Norwegian (Norsk)' },
  { code: 'nl', name: 'Dutch (Nederlands)' },
  { code: 'pl', name: 'Polish (Polski)' },
];

export function TranslateTemplateDialog({
  template,
  isOpen,
  onClose,
  onTemplateCreated
}: TranslateTemplateDialogProps) {
  const router = useRouter();
  const [targetLang, setTargetLang] = useState('es');
  const [translating, setTranslating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isClosing, setIsClosing] = useState(false); // Prevent reopening during close
  const [translatedHtml, setTranslatedHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [originalLines, setOriginalLines] = useState<string[]>([]);
  const [translatedLines, setTranslatedLines] = useState<string[]>([]);
  const [validation, setValidation] = useState<PlaceholderValidation | null>(null);

  const sourceLang = template ? parseTemplateName(template.name).locale || 'en' : 'en';

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      // Small delay before resetting to allow close animation
      const timer = setTimeout(() => {
        setTranslatedHtml(null);
        setError(null);
        setOriginalLines([]);
        setTranslatedLines([]);
        setTargetLang('es');
        setIsClosing(false);
        setValidation(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleTranslate = async () => {
    if (!template) return;

    setTranslating(true);
    setError(null);

    try {
      // Get primary provider (defaults to Cloudflare if none configured)
      const provider = await getPrimaryProvider();

      // Step 1: Decompose HTML into segments (tags, text, placeholders)
      const { segments, translatableText } = extractTranslatableText(template.code);

      if (!translatableText) {
        throw new Error('No translatable text found in template');
      }

      // Step 2: Translate ONLY the text segments (API will protect placeholders)
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: translatableText,
          sourceLang,
          targetLang,
          provider: provider.provider,
          apiKey: provider.apiKey,
          projectId: (provider as any).projectId,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Translation failed';
        const contentType = response.headers.get('content-type');

        if (contentType?.includes('application/json')) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = `Server error (${response.status})`;
          }
        } else {
          try {
            const errorText = await response.text();
            errorMessage = errorText || `Server error (${response.status})`;
          } catch {
            errorMessage = `Server error (${response.status})`;
          }
        }
        throw new Error(errorMessage);
      }

      const { translatedText, validation: validationResult } = await response.json();

      // Store validation results
      if (validationResult) {
        setValidation(validationResult);
      }

      // Step 3: Reconstruct HTML with translated text
      const reconstructedHtml = reconstructHTML(segments, translatedText);
      setTranslatedHtml(reconstructedHtml);

      // For side-by-side comparison
      setOriginalLines([translatableText]);
      setTranslatedLines([translatedText]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed');
    } finally {
      setTranslating(false);
    }
  };

  const handleSave = async () => {
    if (!template || !translatedHtml || isClosing) return;

    setSaving(true);
    setIsClosing(true);
    setError(null);

    try {
      // Preserve the original separator (- or _) from template name
      const { theme, locale } = parseTemplateName(template.name);
      const separator = template.name.includes('_') ? '_' : '-';
      const newName = locale
        ? template.name.replace(new RegExp(`[_-]${locale}$`), `${separator}${targetLang}`)
        : `${theme}${separator}${targetLang}`;

      // Create new template with cached API (auto-invalidates cache)
      const createdTemplate = await createTemplateApi(
        newName,
        translatedHtml, // code
        template.subject, // subject - keep original (or translate separately)
        template.from_email, // fromEmail
        template.from_name, // fromName
        template.text, // text version
        template.labels // labels
      );

      const newSlug = createdTemplate.slug || newName;

      // Mark saving as complete BEFORE closing
      setSaving(false);

      // Close dialog immediately and prevent reopening
      onClose();

      // Use setTimeout to defer navigation until after dialog is fully closed
      setTimeout(() => {
        // Force refresh to update parallel routes
        router.refresh();

        // Navigate to the newly created template
        onTemplateCreated?.(newSlug);

        // Trigger another refresh after navigation
        setTimeout(() => router.refresh(), 150);
      }, 300); // Match the dialog close animation time
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template');
      setSaving(false);
      setIsClosing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[1400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconLanguage size={24} />
            Translate Template
          </DialogTitle>
          <DialogDescription>
            {template && `Translate "${template.name}" to a new locale`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!translatedHtml ? (
            // Translation setup
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Source Language</Label>
                  <Select value={sourceLang} disabled>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGE_OPTIONS.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Target Language</Label>
                  <Select value={targetLang} onValueChange={setTargetLang}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGE_OPTIONS.filter(lang => lang.code !== sourceLang).map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-800 rounded-md">
                  <IconAlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <Button
                onClick={handleTranslate}
                disabled={translating}
                className="w-full"
              >
                {translating ? (
                  <>
                    <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                    Translating...
                  </>
                ) : (
                  'Translate Template'
                )}
              </Button>
            </div>
          ) : (
            // Translation review with diff view
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-md">
                <IconCheck className="h-4 w-4" />
                <span className="text-sm">Translation complete! Review changes below.</span>
              </div>

              {/* Placeholder Validation */}
              {validation && <PlaceholderValidationDisplay validation={validation} />}

              {/* Side-by-side comparison */}
              {originalLines.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-2 bg-gray-100 dark:bg-gray-800 text-sm font-semibold">
                    <div className="p-2 border-r">Original ({sourceLang.toUpperCase()})</div>
                    <div className="p-2">Translated ({targetLang.toUpperCase()})</div>
                  </div>
                  <div className="max-h-[500px] overflow-y-auto">
                    {originalLines.map((origLine, index) => {
                      const transLine = translatedLines[index] || '';
                      return (
                        <div key={index} className="grid grid-cols-2 border-t hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <div className="p-3 text-sm border-r break-words">{origLine}</div>
                          <div className="p-3 text-sm break-words font-medium">{transLine}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-800 rounded-md">
                  <IconAlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => setTranslatedHtml(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Translate Again
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <IconLoader className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    `Save as ${template ? (() => {
                      const { theme, locale } = parseTemplateName(template.name);
                      const separator = template.name.includes('_') ? '_' : '-';
                      return locale
                        ? template.name.replace(new RegExp(`[_-]${locale}$`), `${separator}${targetLang}`)
                        : `${theme}${separator}${targetLang}`;
                    })() : `template-${targetLang}`}`
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

