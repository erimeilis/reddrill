'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MandrillTemplateInfo } from '@/lib/api/mandrill';
import { IconPlus, IconX, IconLayoutGrid, IconTags, IconCheck } from '@tabler/icons-react';
import { useSettingsStore } from '@/lib/store/useSettingsStore';
import { PlaceholderList } from '@/components/templates/placeholder-list';
import { extractUniquePlaceholders } from '@/lib/utils/placeholder-parser';
import { useMandrillStore } from '@/lib/store/useMandrillStore';

interface TemplateDetailProps {
  templateSlug: string | null;
  isOpen: boolean;
  onClose: () => void;
  onTemplateUpdated?: () => void;
}

export function TemplateDetail({ templateSlug, isOpen, onClose, onTemplateUpdated }: TemplateDetailProps) {
  const [template, setTemplate] = useState<MandrillTemplateInfo | null>(null);
  const [editedLabels, setEditedLabels] = useState<string[]>([]);
  const [newLabel, setNewLabel] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { addLastUsedTemplate } = useSettingsStore();

  // Fetch template details when dialog opens
  useEffect(() => {
    // Reset state when dialog closes
    if (!isOpen) {
      setTemplate(null);
      setError(null);
      setLoading(false);
      return;
    }

    // Prevent API call if no template slug provided
    if (!templateSlug) {
      setError('No template selected');
      setLoading(false);
      return;
    }

    // Fetch template details from API
    const fetchTemplateDetails = async (slug: string) => {
      const apiKey = useMandrillStore.getState().apiKey;
      if (!apiKey) {
        setError('Not connected to Mandrill');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/mandrill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey,
            action: 'getTemplateInfo',
            templateName: slug
          })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to fetch template info');
        }

        const templateInfo = result.template;
        setTemplate(templateInfo);
        setEditedLabels(templateInfo.labels || []);

        // Track this template as last used
        addLastUsedTemplate(slug);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to fetch template info');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplateDetails(templateSlug);
  }, [isOpen, templateSlug, addLastUsedTemplate]);

  // Add a new label
  const addLabel = () => {
    if (newLabel.trim() && !editedLabels.includes(newLabel.trim())) {
      setEditedLabels([...editedLabels, newLabel.trim()]);
      setNewLabel('');
    }
  };

  // Remove a label
  const removeLabel = (label: string) => {
    setEditedLabels(editedLabels.filter(l => l !== label));
  };

  // Save template changes
  const saveChanges = async () => {
    if (!template) return;

    const apiKey = useMandrillStore.getState().apiKey;
    if (!apiKey) {
      setError('Not connected to Mandrill');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/mandrill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          action: 'updateTemplate',
          name: template.name,
          labels: editedLabels
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update template');
      }

      // Call onTemplateUpdated if provided
      if (onTemplateUpdated) {
        onTemplateUpdated();
      }
      onClose();
    } catch (err) {
      console.error('Update error:', err);
      setError('Failed to update template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </span>
            ) : template ? template.name : 'Template Details'}
          </DialogTitle>
          <DialogDescription>
            View and edit template details, labels, and content
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="px-6 py-3 bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {template && !loading && (
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-medium mb-3 flex items-center">
                  <IconLayoutGrid size={16} stroke={2} className="mr-2" />
                  Template Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-secondary/30 rounded-md">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Created</p>
                    <p>{new Date(template.created_at).toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-secondary/30 rounded-md">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Last Updated</p>
                    <p>{new Date(template.updated_at).toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-secondary/30 rounded-md">
                    <p className="text-xs font-medium text-muted-foreground mb-1">From Email</p>
                    <p>{template.from_email}</p>
                  </div>
                  <div className="p-3 bg-secondary/30 rounded-md">
                    <p className="text-xs font-medium text-muted-foreground mb-1">From Name</p>
                    <p>{template.from_name}</p>
                  </div>
                  <div className="p-3 bg-secondary/30 rounded-md col-span-1 sm:col-span-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Subject</p>
                    <p>{template.subject}</p>
                  </div>
                </div>
              </div>

              {/* HTML Preview */}
              {template.code && (
                <div>
                  <h3 className="text-base font-medium mb-3">HTML Preview</h3>
                  <div className="border rounded-md p-4 bg-background max-h-[400px] overflow-auto">
                    <div dangerouslySetInnerHTML={{ __html: template.code }} />
                  </div>
                </div>
              )}

              {/* Plain Text */}
              {template.text && (
                <div>
                  <h3 className="text-base font-medium mb-3">Plain Text Version</h3>
                  <div className="border rounded-md p-4 bg-secondary/30 max-h-[200px] overflow-auto">
                    <pre className="text-sm whitespace-pre-wrap">{template.text}</pre>
                  </div>
                </div>
              )}

              {/* Placeholders */}
              <PlaceholderList placeholders={extractUniquePlaceholders(template)} />

              <div>
                <h3 className="text-base font-medium mb-3 flex items-center">
                  <IconTags size={16} stroke={2} className="mr-2" />
                  Labels
                </h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {editedLabels.length > 0 ? (
                    editedLabels.map((label, index) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                      >
                        <span>{label}</span>
                        <button 
                          onClick={() => removeLabel(label)}
                          className="text-secondary-foreground/70 hover:text-secondary-foreground ml-1 h-4 w-4 flex items-center justify-center"
                          aria-label={`Remove ${label} label`}
                        >
                          <IconX size={12} stroke={2} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No labels added yet</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="Add new label"
                      className="pr-20"
                      onKeyDown={(e) => e.key === 'Enter' && addLabel()}
                    />
                    <Button 
                      onClick={addLabel} 
                      variant="icon" 
                      size="sm" 
                      className="absolute right-0 top-0 h-full rounded-l-none"
                      disabled={!newLabel.trim()}
                      title="Add Label"
                    >
                      <IconPlus size={16} stroke={1.5} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="px-6 py-4 border-t">
          <div className="flex justify-between w-full">
            <Button variant="outline" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button onClick={saveChanges} disabled={loading} size="sm">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <IconCheck size={16} stroke={1.5} />
                  Save
                </span>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
