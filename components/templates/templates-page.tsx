'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { IconRefresh, IconEye, IconLanguage, IconPlus, IconTrash, IconCopy } from '@tabler/icons-react';
import { MandrillTemplate } from '@/lib/api/mandrill';
import { TemplateDetail } from '@/components/templates/template-detail';
import mandrillClient from '@/lib/api/mandrill';
import { parseTemplateName } from '@/lib/utils/template-parser';
import { getLocaleFlag } from '@/lib/constants/locales';
import { TemplateFiltersComponent, type TemplateFilters } from '@/components/templates/template-filters';
import { TemplateTreeView } from '@/components/templates/template-tree-view';
import { TranslateTemplateDialog } from '@/components/translation/translate-template-dialog';
import type { TreeViewMode } from '@/lib/utils/template-tree';
import { IconTable, IconList } from '@tabler/icons-react';
import { useTemplates, createTemplate as createTemplateApi, deleteTemplate as deleteTemplateApi } from '@/lib/hooks/use-templates';
import { useMandrillConnection } from '@/lib/hooks/useMandrillConnection';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PromptDialog } from '@/components/ui/prompt-dialog';
import { useSettingsStore } from '@/lib/store/useSettingsStore';
import { ExportButton } from '@/components/templates/export-button';
import { ImportButton } from '@/components/templates/import-button';
import { importTemplates } from '@/lib/utils/template-import';
import type { TemplateExportData } from '@/lib/utils/template-export';

// Helper component for table rows with scroll functionality
function TableRowWithRef({
  isSelected,
  onClick,
  children
}: {
  isSelected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const rowRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (isSelected && rowRef.current) {
      rowRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [isSelected]);

  return (
    <TableRow
      ref={rowRef}
      className={`cursor-pointer transition-colors ${
        isSelected
          ? 'bg-primary/10 hover:bg-primary/15 border-l-4 border-l-primary'
          : 'hover:bg-muted/50'
      }`}
      onClick={onClick}
    >
      {children}
    </TableRow>
  );
}

export function TemplatesPage() {
  const router = useRouter();
  const pathname = usePathname();

  // Require authentication - redirect to home if not logged in
  useMandrillConnection(true);

  // Extract selected slug from pathname (e.g., /templates/my-template-slug)
  const selectedSlug = pathname?.startsWith('/templates/')
    ? decodeURIComponent(pathname.split('/templates/')[1])
    : null;

  // Get view preferences from Zustand store (persisted in IndexedDB)
  const { viewMode, treeMode, setViewMode, setTreeMode } = useSettingsStore();

  // Local UI state
  const [filters, setFilters] = useState<TemplateFilters>({ theme: '', label: '', locale: '' });
  const [sortField, setSortField] = useState<keyof MandrillTemplate>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [translateTemplate, setTranslateTemplate] = useState<MandrillTemplate | null>(null);
  const [isTranslateOpen, setIsTranslateOpen] = useState<boolean>(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);

  // Dialog state
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; template: MandrillTemplate | null }>({ open: false, template: null });
  const [cloneDialog, setCloneDialog] = useState<{ open: boolean; template: MandrillTemplate | null }>({ open: false, template: null });

  // Fetch templates with SWR caching
  const { templates, loading, error, refresh } = useTemplates();

  // Get available locales from templates
  const availableLocales = Array.from(
    new Set(
      (Array.isArray(templates) ? templates : [])
        .map(t => parseTemplateName(t.name).locale)
        .filter((locale): locale is string => locale !== null)
    )
  ).sort();

  // Filter templates based on filters
  const filteredTemplates = (Array.isArray(templates) ? templates : []).filter(template => {
    const { theme, locale } = parseTemplateName(template.name);

    const matchesTheme = !filters.theme ||
      theme.toLowerCase().includes(filters.theme.toLowerCase());

    const matchesLabel = !filters.label ||
      template.labels.some(l => l.toLowerCase().includes(filters.label.toLowerCase()));

    const matchesLocale = !filters.locale ||
      locale?.toLowerCase() === filters.locale.toLowerCase();

    return matchesTheme && matchesLabel && matchesLocale;
  });

  // Sort templates based on sort field and direction
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    // Priority sorting: templates with labels AND translations first
    const aHasLabels = a.labels.length > 0;
    const bHasLabels = b.labels.length > 0;
    const aHasLocale = parseTemplateName(a.name).locale !== null;
    const bHasLocale = parseTemplateName(b.name).locale !== null;

    const aPriority = aHasLabels && aHasLocale;
    const bPriority = bHasLabels && bHasLocale;

    // Prioritize templates with both labels and translations
    if (aPriority && !bPriority) return -1;
    if (!aPriority && bPriority) return 1;

    // Then sort by selected field
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedTemplates.length / itemsPerPage);
  const paginatedTemplates = sortedTemplates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortField, sortDirection]);

  // Navigate to the page containing the selected template (only when slug changes)
  const previousSelectedSlugRef = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedSlug || viewMode !== 'table') return;

    // Only auto-paginate if the slug actually changed
    if (selectedSlug === previousSelectedSlugRef.current) return;
    previousSelectedSlugRef.current = selectedSlug;

    const templateIndex = sortedTemplates.findIndex(t => t.slug === selectedSlug);
    if (templateIndex === -1) return;

    const pageContainingTemplate = Math.floor(templateIndex / itemsPerPage) + 1;
    if (pageContainingTemplate !== currentPage) {
      setCurrentPage(pageContainingTemplate);
    }
  }, [selectedSlug, sortedTemplates, itemsPerPage, viewMode, currentPage]);

  // Toggle sort direction or change sort field
  const handleSort = (field: keyof MandrillTemplate) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Render sort indicator
  const renderSortIndicator = (field: keyof MandrillTemplate) => {
    if (field !== sortField) return null;
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  const handleLocaleClick = (slug: string) => {
    router.push(`/templates/${slug}`);
  };

  const handleImport = async (data: TemplateExportData) => {
    try {
      const result = await importTemplates(data, mandrillClient);

      if (!result.success) {
        throw new Error(`Import completed with errors:\n${result.errors.slice(0, 3).join('\n')}`);
      }

      // Refresh templates list after successful import
      await refresh();
    } catch (error) {
      throw error;
    }
  };

  const handleCreateTemplate = async () => {
    const newName = prompt('Enter a name for the new template:');
    if (!newName || !newName.trim()) {
      return;
    }

    try {
      // Create a blank template using cached API (auto-invalidates cache)
      const createdTemplate = await createTemplateApi(
        newName.trim(),
        '', // Empty HTML
        'New Template', // Default subject
        '', // No from email
        '', // No from name
        '', // No text version
        [] // No labels
      );

      // Navigate to the new template using its actual slug
      router.push(`/templates/${encodeURIComponent(createdTemplate.slug || newName.trim())}`);
    } catch (err) {
      console.error('Error creating template:', err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-4 sm:py-6">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Templates</h1>
          <div className="flex gap-2">
            {/* View mode toggle */}
            <div className="flex gap-1 bg-secondary/50 p-1 rounded-lg">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                title="Table View"
              >
                <IconTable size={16} />
              </Button>
              <Button
                variant={viewMode === 'tree' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('tree')}
                title="Tree View"
              >
                <IconList size={16} />
              </Button>
            </div>

            <ExportButton
              templates={templates || []}
              disabled={loading}
            />

            <ImportButton
              currentTemplateCount={(templates || []).length}
              onImport={handleImport}
              disabled={loading}
            />

            <Button
              onClick={handleCreateTemplate}
              disabled={loading}
              title="Create New Template"
              className="h-10"
            >
              <IconPlus size={18} className="mr-2" />
              Create New
            </Button>

            <Button
              onClick={() => refresh()}
              disabled={loading}
              variant="icon"
              size="icon"
              title="Refresh Templates"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <IconRefresh size={18} stroke={1.5} />
              )}
            </Button>
          </div>
        </div>

        {viewMode === 'table' && (
          <TemplateFiltersComponent
            filters={filters}
            onFiltersChange={setFilters}
            availableLocales={availableLocales}
          />
        )}
      </div>

      {viewMode === 'tree' ? (
        <TemplateTreeView
          templates={filteredTemplates}
          treeMode={treeMode}
          onTreeModeChange={setTreeMode}
          onLocaleClick={handleLocaleClick}
          onPreview={(slug) => {
            setSelectedTemplate(slug);
            setIsDetailOpen(true);
          }}
          onTranslate={async (slug) => {
            const info = await mandrillClient.getTemplateInfo(slug);
            setTranslateTemplate(info);
            setIsTranslateOpen(true);
          }}
          onDelete={(slug) => {
            const template = templates.find(t => t.slug === slug);
            if (template) {
              setDeleteDialog({ open: true, template });
            }
          }}
          onClone={(slug) => {
            const template = templates.find(t => t.slug === slug);
            if (template) {
              setCloneDialog({ open: true, template });
            }
          }}
          selectedSlug={selectedSlug}
          onClearSelection={() => router.push('/templates')}
          loading={loading}
        />
      ) : (
        <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Templates</CardTitle>
              <CardDescription>
                {sortedTemplates.length} templates found
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer">
                    Theme
                  </TableHead>
                  <TableHead className="cursor-pointer w-20">
                    Locale
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort('subject')}
                  >
                    Subject{renderSortIndicator('subject')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort('from_email')}
                  >
                    From{renderSortIndicator('from_email')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleSort('labels')}
                  >
                    Labels{renderSortIndicator('labels')}
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Skeleton loading rows
                  Array.from({ length: itemsPerPage }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell>
                        <div className="h-4 bg-muted rounded animate-pulse w-32"></div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="h-6 bg-muted rounded animate-pulse w-8 mx-auto"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-muted rounded animate-pulse w-48"></div>
                      </TableCell>
                      <TableCell>
                        <div className="h-4 bg-muted rounded animate-pulse w-40"></div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <div className="h-6 bg-muted rounded animate-pulse w-16"></div>
                          <div className="h-6 bg-muted rounded animate-pulse w-20"></div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
                          <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
                          <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : sortedTemplates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      {error ? (
                        <div className="text-destructive">
                          Error loading templates: {error}
                        </div>
                      ) : (
                        <div>
                          No templates found. Try adjusting your search or refreshing the list.
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTemplates.map((template) => {
                    const { theme, locale } = parseTemplateName(template.name);
                    const flag = getLocaleFlag(locale);
                    const isSelected = template.slug === selectedSlug;

                    return (
                      <TableRowWithRef
                        key={template.slug}
                        isSelected={isSelected}
                        onClick={() => router.push(`/templates/${template.slug}`)}
                      >
                        <TableCell className="font-medium !py-1" title={template.name}>
                          {theme}
                        </TableCell>
                        <TableCell className="text-center !py-1">
                          <span className="text-lg" title={locale || 'No locale'}>
                            {flag}
                          </span>
                        </TableCell>
                        <TableCell className="!py-1">{template.subject}</TableCell>
                        <TableCell className="!py-1">{template.from_email}</TableCell>
                        <TableCell className="!py-1">
                          <div className="flex flex-wrap gap-1">
                            {template.labels.map((label) => (
                              <span
                                key={label}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary"
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                      <TableCell className="text-right !py-1">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTemplate(template.slug);
                              setIsDetailOpen(true);
                            }}
                            title="View HTML Preview"
                          >
                            <IconEye size={18} stroke={1.5} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={async (e) => {
                              e.stopPropagation();
                              // Load full template info for translation
                              const info = await mandrillClient.getTemplateInfo(template.slug);
                              setTranslateTemplate(info);
                              setIsTranslateOpen(true);
                            }}
                            title="Translate Template"
                          >
                            <IconLanguage size={18} stroke={1.5} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteDialog({ open: true, template });
                            }}
                            title="Delete Template"
                          >
                            <IconTrash size={18} stroke={1.5} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCloneDialog({ open: true, template });
                            }}
                            title="Clone Template"
                          >
                            <IconCopy size={18} stroke={1.5} />
                          </Button>
                        </div>
                        </TableCell>
                      </TableRowWithRef>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={sortedTemplates.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            itemName="templates"
          />
        </CardContent>
      </Card>
      )}

      {/* Translation Dialog */}
      <TranslateTemplateDialog
        template={translateTemplate}
        isOpen={isTranslateOpen}
        onClose={() => {
          setIsTranslateOpen(false);
          setTranslateTemplate(null);
        }}
        onTemplateCreated={(newTemplateName) => {
          // Navigate to the newly created template (cache already invalidated)
          router.push(`/templates/${encodeURIComponent(newTemplateName)}`);
        }}
      />

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <TemplateDetail
          templateSlug={selectedTemplate}
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedTemplate(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, template: null })}
        title="Delete Template"
        description={`Are you sure you want to delete template "${deleteDialog.template?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={async () => {
          if (!deleteDialog.template) return;

          try {
            await deleteTemplateApi(deleteDialog.template.name);

            // Always clear selection after deletion (tree collapses anyway)
            router.push('/templates');
          } catch (error) {
            console.error('Error deleting template:', error);
            alert('Failed to delete template');
          } finally {
            setDeleteDialog({ open: false, template: null });
          }
        }}
      />

      {/* Clone Template Dialog */}
      <PromptDialog
        open={cloneDialog.open}
        onOpenChange={(open) => setCloneDialog({ open, template: null })}
        title="Clone Template"
        description="Enter a name for the cloned template"
        placeholder="template-name"
        defaultValue={cloneDialog.template ? `${cloneDialog.template.name}-copy` : ''}
        confirmText="Clone"
        cancelText="Cancel"
        onConfirm={async (newName) => {
          if (!cloneDialog.template) return;

          try {
            const createdTemplate = await createTemplateApi(
              newName,
              cloneDialog.template.code,
              cloneDialog.template.subject,
              cloneDialog.template.from_email,
              cloneDialog.template.from_name,
              cloneDialog.template.text,
              cloneDialog.template.labels
            );

            // Navigate to the new template
            router.push(`/templates/${encodeURIComponent(createdTemplate.slug || newName)}`);
          } catch (error) {
            console.error('Error cloning template:', error);
            alert('Failed to clone template');
          } finally {
            setCloneDialog({ open: false, template: null });
          }
        }}
      />
    </div>
  );
}
