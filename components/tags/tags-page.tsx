'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { IconRefresh, IconTrash } from '@tabler/icons-react';
import { MandrillTag } from '@/lib/api/mandrill';
import mandrillClient from '@/lib/api/mandrill';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useMandrillConnection } from '@/lib/hooks/useMandrillConnection';

export function TagsPage() {
  // Require authentication - redirect to home if not logged in
  useMandrillConnection(true);

  // Local UI state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<keyof MandrillTag>('tag');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);

  // Local data state
  const [tags, setTags] = useState<MandrillTag[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch tags from API
  const fetchTags = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mandrillClient.listTags();
      setTags(data);
    } catch (err) {
      console.error('Error fetching tags:', err);
      setError('Failed to fetch tags');
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete tag
  const deleteTag = useCallback(async (tag: string) => {
    try {
      await mandrillClient.deleteTag(tag);
      await fetchTags(); // Refresh list after deletion
    } catch (err) {
      console.error('Error deleting tag:', err);
      setError('Failed to delete tag');
    }
  }, [fetchTags]);

  // Load tags on component mount
  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // Reset to page 1 when search or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortField, sortDirection]);

  // Filter tags based on search term
  const filteredTags = tags.filter(tag => 
    tag.tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort tags based on sort field and direction
  const sortedTags = [...filteredTags].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedTags.length / itemsPerPage);
  const paginatedTags = sortedTags.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Toggle sort direction or change sort field
  const handleSort = (field: keyof MandrillTag) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Render sort indicator
  const renderSortIndicator = (field: keyof MandrillTag) => {
    if (field !== sortField) return null;
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  // Handle tag deletion
  const handleDeleteTag = async () => {
    if (!selectedTag) return;

    try {
      await deleteTag(selectedTag);
      setIsDeleteDialogOpen(false);
      setSelectedTag(null);
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-4 sm:py-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="relative w-full sm:max-w-sm">
          <Input
            type="text"
            placeholder="Search tags..."
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
          onClick={fetchTags} 
          disabled={loading} 
          variant="icon"
          size="icon"
          title="Refresh Tags"
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
              <CardTitle>Tags</CardTitle>
              <CardDescription>
                {sortedTags.length} tags found
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
          ) : sortedTags.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tags found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-6">
                <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer w-1/3"
                      onClick={() => handleSort('tag')}
                    >
                      Tag{renderSortIndicator('tag')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('reputation')}
                    >
                      Reputation{renderSortIndicator('reputation')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('sent')}
                    >
                      Sent{renderSortIndicator('sent')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('hard_bounces')}
                    >
                      Hard Bounces{renderSortIndicator('hard_bounces')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('soft_bounces')}
                    >
                      Soft Bounces{renderSortIndicator('soft_bounces')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('rejects')}
                    >
                      Rejects{renderSortIndicator('rejects')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('complaints')}
                    >
                      Complaints{renderSortIndicator('complaints')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('unsubs')}
                    >
                      Unsubs{renderSortIndicator('unsubs')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('opens')}
                    >
                      Opens{renderSortIndicator('opens')}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('clicks')}
                    >
                      Clicks{renderSortIndicator('clicks')}
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTags.map((tag) => (
                    <TableRow key={tag.tag}>
                      <TableCell className="font-medium">{tag.tag}</TableCell>
                      <TableCell>{tag.reputation}</TableCell>
                      <TableCell>{tag.sent}</TableCell>
                      <TableCell>{tag.hard_bounces}</TableCell>
                      <TableCell>{tag.soft_bounces}</TableCell>
                      <TableCell>{tag.rejects}</TableCell>
                      <TableCell>{tag.complaints}</TableCell>
                      <TableCell>{tag.unsubs}</TableCell>
                      <TableCell>{tag.opens}</TableCell>
                      <TableCell>{tag.clicks}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedTag(tag.tag);
                            setIsDeleteDialogOpen(true);
                          }}
                          title="Delete Tag"
                        >
                          <IconTrash size={18} stroke={1.5} className="text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={sortedTags.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                itemName="tags"
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Tag Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the tag &quot;{selectedTag}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTag}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
