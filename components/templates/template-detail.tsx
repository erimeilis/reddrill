'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MandrillTemplateInfo } from '@/lib/api/mandrill';
import { IconPlus, IconX, IconLayoutGrid, IconTags, IconCheck } from '@tabler/icons-react';
import { useTemplateStore } from '@/lib/store/useTemplateStore';

interface TemplateDetailProps {
  templateName: string | null;
  isOpen: boolean;
  onClose: () => void;
  onTemplateUpdated: () => void;
}

export function TemplateDetail({ templateName, isOpen, onClose, onTemplateUpdated }: TemplateDetailProps) {
  const [template, setTemplate] = useState<MandrillTemplateInfo | null>(null);
  const [editedLabels, setEditedLabels] = useState<string[]>([]);
  const [newLabel, setNewLabel] = useState<string>('');

  // Get state and actions from Zustand store
  const { 
    loading, 
    error, 
    getTemplateInfo, 
    updateTemplate 
  } = useTemplateStore();

  // Fetch template details when dialog opens
  useEffect(() => {
    // Fetch template details from store
    const fetchTemplateDetails = async (name: string) => {
      try {
        const templateInfo = await getTemplateInfo(name);
        setTemplate(templateInfo);
        setEditedLabels(templateInfo.labels || []);
      } catch (err) {
        console.error('Fetch error:', err);
        // Error state is handled by the store
      }
    };

    if (isOpen && templateName) {
      fetchTemplateDetails(templateName);
    }
  }, [isOpen, templateName, getTemplateInfo]);

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

    try {
      await updateTemplate(
        template.name,
        undefined, // code
        undefined, // subject
        undefined, // fromEmail
        undefined, // fromName
        undefined, // text
        editedLabels // labels
      );
      onTemplateUpdated();
      onClose();
    } catch (err) {
      console.error('Update error:', err);
      // Error state is handled by the store
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
