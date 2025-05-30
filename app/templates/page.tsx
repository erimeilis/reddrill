'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { IconRefresh, IconEye, IconEdit } from '@tabler/icons-react';
import { MandrillTemplate } from '@/lib/api/mandrill';
import { TemplateDetail } from '@/components/templates/template-detail';
import { useTemplateStore } from '@/lib/store/useTemplateStore';

export default function TemplatesPage() {
  // Local UI state
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<keyof MandrillTemplate>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // Get state and actions from Zustand store
  const { 
    templates, 
    apiKey, 
    isConnected, 
    loading, 
    error, 
    setApiKey: storeSetApiKey, 
    fetchTemplates 
  } = useTemplateStore();

  // Load saved API key and templates on component mount
  useEffect(() => {
    // If we already have an API key in the store, set it in the input field
    if (apiKey) {
      setApiKeyInput(apiKey);
    }

    // If we're connected but don't have templates, fetch them
    if (isConnected && templates.length === 0) {
      fetchTemplates();
    }
  }, [apiKey, isConnected, templates.length, fetchTemplates]);

  // Initialize Mandrill client when API key is provided
  const connectToMandrill = async () => {
    if (!apiKeyInput.trim()) {
      // Use the store's error handling
      useTemplateStore.setState({ error: 'Please enter a valid Mandrill API key' });
      return;
    }

    // Set the API key in the store, which will also fetch templates
    await storeSetApiKey(apiKeyInput);
  };

  // Filter templates based on search term
  const filteredTemplates = templates.filter(template => 
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.labels.some(label => label.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Sort templates based on sort field and direction
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

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

  return (
    <div className="container mx-auto px-4 py-4 sm:py-6">
      {!isConnected ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <Card className="w-full max-w-md shadow-sm">
            <CardHeader>
              <CardTitle>Connect to Mandrill</CardTitle>
              <CardDescription>Enter your Mandrill API key to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); connectToMandrill(); }} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="Mandrill API Key"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="w-full"
                    autoFocus
                  />
                  {error && (
                    <div className="text-sm text-destructive">
                      {error}
                    </div>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || !apiKeyInput.trim()}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Connecting...
                    </span>
                  ) : (
                    'Connect'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <div className="relative w-full sm:max-w-sm">
              <Input
                type="text"
                placeholder="Search templates by name or tag..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
              </div>
            </div>
            <Button 
              onClick={fetchTemplates} 
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

          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Templates</CardTitle>
                  <CardDescription>
                    {sortedTemplates.length} templates found
                  </CardDescription>
                </div>
                {loading && (
                  <div className="text-sm text-muted-foreground animate-pulse">
                    Loading...
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="rounded-md bg-destructive/10 p-4 text-destructive">
                  {error}
                </div>
              ) : sortedTemplates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No templates found
                </div>
              ) : (
                <div className="overflow-x-auto -mx-6">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer w-1/3"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center">
                            Name
                            <span className="ml-1">{renderSortIndicator('name')}</span>
                          </div>
                        </TableHead>
                        <TableHead className="hidden sm:table-cell">Labels</TableHead>
                        <TableHead 
                          className="cursor-pointer hidden md:table-cell"
                          onClick={() => handleSort('updated_at')}
                        >
                          <div className="flex items-center">
                            Last Updated
                            <span className="ml-1">{renderSortIndicator('updated_at')}</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedTemplates.map((template) => (
                        <TableRow key={template.slug} className="group">
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              {template.name}
                              <span className="text-xs text-muted-foreground md:hidden">
                                {new Date(template.updated_at).toLocaleDateString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {template.labels.map((label, index) => (
                                <span 
                                  key={index} 
                                  className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full text-xs"
                                >
                                  {label}
                                </span>
                              ))}
                              {template.labels.length === 0 && (
                                <span className="text-xs text-muted-foreground">No labels</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">
                            {new Date(template.updated_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="icon" 
                                size="icon"
                                className="hidden sm:inline-flex"
                                onClick={() => {
                                  setSelectedTemplate(template.name);
                                  setIsDetailOpen(true);
                                }}
                                title="View Template"
                              >
                                <IconEye size={18} stroke={1.5} />
                              </Button>
                              <Button 
                                variant="icon" 
                                size="icon"
                                onClick={() => {
                                  setSelectedTemplate(template.name);
                                  setIsDetailOpen(true);
                                }}
                                title="Edit Template"
                              >
                                <IconEdit size={18} stroke={1.5} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Template Detail Dialog */}
      <TemplateDetail
        templateName={selectedTemplate}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedTemplate(null);
        }}
        onTemplateUpdated={fetchTemplates}
      />
    </div>
  );
}
