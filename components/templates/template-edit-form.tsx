'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { IconX, IconCheck, IconLoader2, IconTrash, IconCopy, IconTestPipe } from '@tabler/icons-react';
import { MandrillTemplate } from '@/lib/api/mandrill';
import dynamic from 'next/dynamic';
import type { Editor } from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import grapesJSPresetNewsletter from 'grapesjs-preset-newsletter';
import { useTemplate, useTemplates, updateTemplate as updateTemplateApi, deleteTemplate as deleteTemplateApi, createTemplate as createTemplateApi } from '@/lib/hooks/use-templates';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PromptDialog } from '@/components/ui/prompt-dialog';
import { normalizeHtmlForEditor } from '@/lib/utils/html-normalizer';

const GjsEditor = dynamic(() => import('@grapesjs/react').then(mod => mod.default), {
  ssr: false,
});

interface TemplateEditFormProps {
  templateSlug: string;
}

export function TemplateEditForm({ templateSlug }: TemplateEditFormProps) {
  const router = useRouter();
  const editorRef = useRef<Editor | null>(null);
  const { templates } = useTemplates(); // Get all templates from the hook
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Dialog state
  const [cancelDialog, setCancelDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [cloneDialog, setCloneDialog] = useState(false);

  // Use cached template data
  const { template, loading, error: loadError } = useTemplate(templateSlug);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');
  const [text, setText] = useState('');
  const [labels, setLabels] = useState<string[]>([]);
  const [labelInput, setLabelInput] = useState('');

  // Initialize form fields when template loads
  useEffect(() => {
    if (template) {
      setName(template.name);
      setSubject(template.subject || '');
      setFromEmail(template.from_email || '');
      setFromName(template.from_name || '');
      setText(template.text || '');
      setLabels(template.labels || []);
    }
  }, [template]);

  // Track unsaved changes
  useEffect(() => {
    if (!template) return;

    const changed =
      name !== template.name ||
      subject !== (template.subject || '') ||
      fromEmail !== (template.from_email || '') ||
      fromName !== (template.from_name || '') ||
      text !== (template.text || '') ||
      JSON.stringify(labels) !== JSON.stringify(template.labels || []);

    setHasUnsavedChanges(changed);
  }, [name, subject, fromEmail, fromName, text, labels, template]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleAddLabel = () => {
    const trimmed = labelInput.trim();
    if (trimmed && !labels.includes(trimmed)) {
      setLabels([...labels, trimmed]);
      setLabelInput('');
    }
  };

  const handleRemoveLabel = (label: string) => {
    setLabels(labels.filter(l => l !== label));
  };

  const handleSave = async () => {
    if (!editorRef.current) {
      setError('Editor not ready');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Get HTML from GrapesJS editor
      const html = editorRef.current.getHtml();

      // Use cached API with automatic revalidation
      await updateTemplateApi(
        templateSlug,
        html,
        subject,
        fromEmail,
        fromName,
        text,
        labels
      );

      setHasUnsavedChanges(false);

      // Force refresh to update all parallel routes
      router.refresh();
    } catch (err) {
      console.error('Error saving template:', err);
      setError('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setCancelDialog(true);
    } else {
      router.push('/templates');
    }
  };

  const handleDelete = () => {
    setDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      setError(null);

      // Get templates from cache to find the next one to select
      const allTemplates = templates;

      // Find the current template to get its labels
      const currentTemplate = allTemplates.find((t: any) => t.slug === templateSlug);
      const currentLabels = currentTemplate?.labels || [];

      // Filter templates in the same label group (any shared label)
      const sameLabelTemplates = allTemplates.filter((t: any) => {
        if (t.slug === templateSlug) return false; // Exclude current
        const templateLabels = t.labels || [];
        // Check if there's any overlap in labels
        return currentLabels.some((label: string) => templateLabels.includes(label));
      });

      // Sort by name to match tree view default sorting
      sameLabelTemplates.sort((a: any, b: any) => a.name.localeCompare(b.name));

      // Find current position in the label group
      const currentIndex = allTemplates
        .filter((t: any) => {
          const templateLabels = t.labels || [];
          return currentLabels.some((label: string) => templateLabels.includes(label));
        })
        .sort((a: any, b: any) => a.name.localeCompare(b.name))
        .findIndex((t: any) => t.slug === templateSlug);

      // Find next template to select (prefer next in same label, fallback to any)
      let nextTemplate = null;
      if (sameLabelTemplates.length > 0) {
        // Try to select the template at the same index position within label group
        if (currentIndex >= 0 && currentIndex < sameLabelTemplates.length) {
          nextTemplate = sameLabelTemplates[currentIndex];
        } else {
          // Select the last template in the label group
          nextTemplate = sameLabelTemplates[sameLabelTemplates.length - 1];
        }
      } else {
        // No templates in same label, fallback to any template
        const remainingTemplates = allTemplates.filter((t: any) => t.slug !== templateSlug);
        if (remainingTemplates.length > 0) {
          nextTemplate = remainingTemplates[0];
        }
      }

      // Delete using cached API (this will update the cache immediately)
      await deleteTemplateApi(templateSlug);

      // Force refresh all server components and parallel routes
      router.refresh();

      // Small delay to ensure cache propagation and refresh before navigation
      await new Promise(resolve => setTimeout(resolve, 150));

      // Navigate to next template or templates root
      if (nextTemplate) {
        router.push(`/templates/${encodeURIComponent(nextTemplate.slug)}`);
      } else {
        router.push(`/templates`);
      }

      // Trigger another refresh after navigation
      setTimeout(() => router.refresh(), 100);
    } catch (err) {
      console.error('Error deleting template:', err);
      setError('Failed to delete template');
    } finally {
      setDeleting(false);
      setDeleteDialog(false);
    }
  };

  const handleClone = () => {
    setCloneDialog(true);
  };

  const confirmClone = async (newName: string) => {
    if (!editorRef.current) {
      setError('Editor not ready');
      return;
    }

    try {
      setCloning(true);
      setError(null);

      // Get current HTML from editor
      const html = editorRef.current.getHtml();

      // Create using cached API with automatic revalidation
      const createdTemplate = await createTemplateApi(
        newName,
        html,
        subject,
        fromEmail,
        fromName,
        text,
        labels
      );

      // Force refresh all server components and parallel routes
      router.refresh();

      // Small delay before navigation
      await new Promise(resolve => setTimeout(resolve, 150));

      // Navigate to the new template using its actual slug
      router.push(`/templates/${encodeURIComponent(createdTemplate.slug || newName)}`);

      // Trigger another refresh after navigation
      setTimeout(() => router.refresh(), 100);
    } catch (err) {
      console.error('Error cloning template:', err);
      setError('Failed to clone template');
    } finally {
      setCloning(false);
      setCloneDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <IconLoader2 className="animate-spin mr-2" size={24} />
            <span>Loading template...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if ((loadError || error) && !template) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12">
            <p className="text-destructive text-center">{error || loadError || 'Failed to load template'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Edit Template: {template?.name}</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="accent"
                onClick={() => router.push(`/templates/${templateSlug}/test`)}
                disabled={saving || deleting || cloning}
                title="Test template with dynamic data"
              >
                <IconTestPipe size={18} className="mr-2" />
                Test
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting || saving || cloning} title="Delete template">
                {deleting ? (
                  <>
                    <IconLoader2 className="animate-spin mr-2" size={18} />
                    Deleting...
                  </>
                ) : (
                  <>
                    <IconTrash size={18} className="mr-2" />
                    Delete
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleClone} disabled={cloning || saving || deleting} title="Clone template">
                {cloning ? (
                  <>
                    <IconLoader2 className="animate-spin mr-2" size={18} />
                    Cloning...
                  </>
                ) : (
                  <>
                    <IconCopy size={18} className="mr-2" />
                    Clone
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={saving || deleting || cloning}>
                <IconX size={18} className="mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || deleting || cloning || !hasUnsavedChanges}>
                {saving ? (
                  <>
                    <IconLoader2 className="animate-spin mr-2" size={18} />
                    Saving...
                  </>
                ) : (
                  <>
                    <IconCheck size={18} className="mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={name}
                readOnly
                className="bg-muted cursor-not-allowed"
                placeholder="template_name_locale"
              />
              <p className="text-xs text-muted-foreground">Template names cannot be changed. Use Clone to create a copy with a new name.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Email Subject *</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject line"
                disabled={saving}
                required
              />
            </div>
          </div>

          {/* From Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromEmail">From Email *</Label>
              <Input
                id="fromEmail"
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                placeholder="noreply@example.com"
                disabled={saving}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromName">From Name</Label>
              <Input
                id="fromName"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="Your Company"
                disabled={saving}
              />
            </div>
          </div>

          {/* Labels */}
          <div className="space-y-2">
            <Label htmlFor="labelInput">Labels</Label>
            <div className="flex gap-2">
              <Input
                id="labelInput"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLabel())}
                placeholder="Add label"
                disabled={saving}
              />
              <Button onClick={handleAddLabel} disabled={saving} variant="outline">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {labels.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center px-3 py-1 rounded bg-primary/10 text-primary text-sm"
                >
                  {label}
                  <button
                    onClick={() => handleRemoveLabel(label)}
                    disabled={saving}
                    className="ml-2 hover:text-destructive"
                  >
                    <IconX size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* HTML Email Editor */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Email Template Editor</Label>
              <span className="text-xs text-muted-foreground">
                GrapesJS drag & drop email builder
              </span>
            </div>
            <div className="relative border-2 rounded-md overflow-hidden" style={{ height: '700px' }}>
              <GjsEditor
                grapesjs="https://unpkg.com/grapesjs"
                grapesjsCss="https://unpkg.com/grapesjs/dist/css/grapes.min.css"
                plugins={[grapesJSPresetNewsletter]}
                options={{
                  height: '700px',
                  storageManager: false,
                  // Canvas settings
                  canvas: {
                    styles: [
                      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
                    ],
                  },
                }}
                onEditor={(editor: Editor) => {
                  editorRef.current = editor;

                  const code = template?.code?.trim() || '';

                  // Check if content has HTML tags (actual HTML structure)
                  const hasHtmlTags = /<[^>]+>/.test(code);

                  // Check if it's just raw placeholder
                  const isRawPlaceholder = code === '*|raw|*' || code === '*!raw!*' || code === '';

                  if (hasHtmlTags && code.length > 50) {
                    // Has real HTML structure - normalize to wrap raw text nodes in <p> tags
                    const normalizedHtml = normalizeHtmlForEditor(code);
                    editor.setComponents(normalizedHtml);
                  } else if (isRawPlaceholder) {
                    // Empty or raw placeholder - use starter template
                    editor.setComponents(`
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="padding: 40px 0;">
                            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff;">
                              <tr>
                                <td style="padding: 40px;">
                                  <h1 style="margin: 0 0 20px 0; font-family: Arial, sans-serif; font-size: 24px; color: #333333;">Welcome!</h1>
                                  <p style="margin: 0 0 15px 0; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #666666;">Double-click on any text to edit it.</p>
                                  <p style="margin: 0; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #666666;">Drag blocks from the right panel to add more content.</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    `);
                  } else {
                    // Plain text content (like SMS templates) - wrap in email structure
                    const escapedText = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    editor.setComponents(`
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="center" style="padding: 40px 0;">
                            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff;">
                              <tr>
                                <td style="padding: 40px;">
                                  <p style="margin: 0; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #666666; white-space: pre-wrap;">${escapedText}</p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    `);
                  }

                  // Track changes
                  editor.on('component:update', () => {
                    setHasUnsavedChanges(true);
                  });
                }}
              />
            </div>
          </div>

          {/* Plain Text */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="text">Plain Text Version</Label>
              <span className="text-xs text-muted-foreground">
                {text.length} characters
              </span>
            </div>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Plain text fallback"
              disabled={saving}
              className="min-h-[200px] resize-y"
            />
          </div>
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        open={cancelDialog}
        onOpenChange={setCancelDialog}
        title="Unsaved Changes"
        description="You have unsaved changes. Are you sure you want to cancel?"
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        variant="destructive"
        onConfirm={() => {
          setCancelDialog(false);
          router.push('/templates');
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        title="Delete Template"
        description={`Are you sure you want to delete template "${template?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDelete}
      />

      {/* Clone Template Dialog */}
      <PromptDialog
        open={cloneDialog}
        onOpenChange={setCloneDialog}
        title="Clone Template"
        description="Enter a name for the cloned template"
        placeholder="template-name"
        defaultValue={template ? `${template.name}-copy` : ''}
        confirmText="Clone"
        cancelText="Cancel"
        onConfirm={confirmClone}
      />
    </div>
  );
}
