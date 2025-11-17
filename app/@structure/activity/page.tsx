'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { IconRefresh, IconEye } from '@tabler/icons-react';
import type { MandrillMessage } from '@/lib/api/mandrill';
import { useMandrillConnection } from '@/lib/hooks/useMandrillConnection';
import { useMandrillStore } from '@/lib/store/useMandrillStore';
import { PageHeader } from '@/components/ui/page-header';
import { SearchWithActions } from '@/components/ui/search-with-actions';
import { MessageDetailDialog } from '@/components/activity/message-detail-dialog';

export default function ActivityPage() {
  // Require authentication - redirect to home if not logged in
  useMandrillConnection(true);

  // Local UI state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<keyof MandrillMessage>('ts');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedMessage, setSelectedMessage] = useState<MandrillMessage | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Local data state
  const [messages, setMessages] = useState<MandrillMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch messages from API
  const fetchMessages = useCallback(async () => {
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
          action: 'searchMessages',
          query: '*',
          limit: 1000
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch messages');
      }

      setMessages(result.results);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load messages on component mount
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Reset to page 1 when search or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortField, sortDirection]);

  // Filter messages based on search term
  const filteredMessages = messages.filter(message =>
    message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.sender.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort messages based on sort field and direction
  const sortedMessages = [...filteredMessages].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (aValue === undefined || bValue === undefined) return 0;
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedMessages.length / itemsPerPage);
  const paginatedMessages = sortedMessages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Toggle sort direction or change sort field
  const handleSort = (field: keyof MandrillMessage) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Render sort indicator
  const renderSortIndicator = (field: keyof MandrillMessage) => {
    if (field !== sortField) return null;
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  // Format timestamp
  const formatTimestamp = (ts: number) => {
    return new Date(ts * 1000).toLocaleString();
  };

  // Get status badge color
  const getStatusColor = (state: string) => {
    switch (state) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'bounced':
        return 'bg-red-100 text-red-800';
      case 'rejected':
        return 'bg-orange-100 text-orange-800';
      case 'spam':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-4 sm:py-6">
      <PageHeader
        title="Activity"
        actions={
          <SearchWithActions
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search messages..."
            actions={
              <Button
                onClick={fetchMessages}
                disabled={loading}
                variant="icon"
                size="icon"
                title="Refresh Messages"
                className="shrink-0"
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
            }
          />
        }
      />

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Recent Messages</CardTitle>
              <CardDescription>
                {sortedMessages.length} messages found
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
          ) : sortedMessages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No messages found
            </div>
          ) : (
            <>
              <div
                className="overflow-y-auto overflow-x-auto"
                style={{ maxHeight: `${Math.min(itemsPerPage * 60 + 60, 800)}px` }}
              >
                <Table className="w-full">
                <TableHeader className="sticky top-0 bg-background z-10 border-b">
                  <TableRow>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort('ts')}
                    >
                      Time{renderSortIndicator('ts')}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort('subject')}
                    >
                      Subject{renderSortIndicator('subject')}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort('email')}
                    >
                      To{renderSortIndicator('email')}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort('sender')}
                    >
                      From{renderSortIndicator('sender')}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort('state')}
                    >
                      Status{renderSortIndicator('state')}
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMessages.map((message) => (
                    <TableRow key={message._id}>
                      <TableCell>{formatTimestamp(message.ts)}</TableCell>
                      <TableCell className="font-medium">{message.subject}</TableCell>
                      <TableCell>{message.email}</TableCell>
                      <TableCell>{message.sender}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(message.state)}`}>
                          {message.state}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setSelectedMessage(message);
                            setIsDetailOpen(true);
                          }}
                          title="View Message Details"
                        >
                          <IconEye size={14} stroke={1.5} />
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
                totalItems={sortedMessages.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(newItemsPerPage) => {
                  setItemsPerPage(newItemsPerPage);
                  setCurrentPage(1);
                }}
                itemName="messages"
              />
            </>
          )}
        </CardContent>
      </Card>

      <MessageDetailDialog
        message={selectedMessage}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
}
