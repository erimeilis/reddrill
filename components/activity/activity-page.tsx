'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { IconRefresh } from '@tabler/icons-react';
import { MandrillMessage } from '@/lib/api/mandrill';
import mandrillClient from '@/lib/api/mandrill';
import { useMandrillConnection } from '@/lib/hooks/useMandrillConnection';
import { format, formatDistanceToNow } from 'date-fns';
import { ActivityFiltersComponent, ActivityFilters } from './activity-filters';

export function ActivityPage() {
  // Require authentication - redirect to home if not logged in
  useMandrillConnection(true);

  // Data state
  const [messages, setMessages] = useState<MandrillMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<ActivityFilters>({
    dateFrom: null,
    dateTo: null,
    tag: null,
    sender: null,
    status: null,
    searchTerm: '',
  });

  // Sorting state
  const [sortField, setSortField] = useState<'ts' | 'email' | 'sender' | 'state'>('ts');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);

  // Dialog state
  const [selectedMessage, setSelectedMessage] = useState<MandrillMessage | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // Fetch messages from API
  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await mandrillClient.searchMessages({
        query: '*', // Get all messages
        limit: 100, // Max per call
      });
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

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortField, sortDirection]);

  // Extract unique tags and senders from messages
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    messages.forEach(message => {
      message.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [messages]);

  const availableSenders = useMemo(() => {
    const senderSet = new Set<string>();
    messages.forEach(message => {
      senderSet.add(message.sender);
    });
    return Array.from(senderSet).sort();
  }, [messages]);

  // Filter messages based on filter state
  const filteredMessages = useMemo(() => {
    return messages.filter(message => {
      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        const messageDate = new Date(message.ts * 1000);
        if (filters.dateFrom && messageDate < new Date(filters.dateFrom)) return false;
        if (filters.dateTo && messageDate > new Date(filters.dateTo)) return false;
      }

      // Tag filter
      if (filters.tag && filters.tag !== 'all' && !message.tags.includes(filters.tag)) {
        return false;
      }

      // Sender filter
      if (filters.sender && filters.sender !== 'all' && message.sender !== filters.sender) {
        return false;
      }

      // Status filter
      if (filters.status && filters.status !== 'all') {
        // Derive engagement status
        const hasOpens = message.opens > 0;
        const hasClicks = message.clicks > 0;

        if (filters.status === 'opened' && !hasOpens) return false;
        if (filters.status === 'clicked' && !hasClicks) return false;
        if (filters.status !== 'opened' && filters.status !== 'clicked' && message.state !== filters.status) {
          return false;
        }
      }

      // Search filter (recipient email and subject)
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesEmail = message.email.toLowerCase().includes(searchLower);
        const matchesSubject = message.subject.toLowerCase().includes(searchLower);
        if (!matchesEmail && !matchesSubject) return false;
      }

      return true;
    });
  }, [messages, filters]);

  // Sort messages based on sort field and direction
  const sortedMessages = useMemo(() => {
    return [...filteredMessages].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredMessages, sortField, sortDirection]);

  // Pagination logic
  const totalPages = Math.ceil(sortedMessages.length / itemsPerPage);
  const paginatedMessages = useMemo(() => {
    return sortedMessages.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [sortedMessages, currentPage, itemsPerPage]);

  // Toggle sort direction or change sort field
  const handleSort = (field: typeof sortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Render sort indicator
  const renderSortIndicator = (field: typeof sortField) => {
    if (field !== sortField) return null;
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  // Get status badge variant
  const getStatusVariant = (message: MandrillMessage): 'default' | 'secondary' | 'destructive' => {
    // Prioritize engagement
    if (message.clicks > 0) return 'default'; // Clicked
    if (message.opens > 0) return 'default'; // Opened

    // Delivery status
    if (message.state === 'sent') return 'default';
    if (message.state === 'bounced' || message.state === 'rejected') return 'destructive';
    return 'secondary'; // deferred, queued, soft-bounced
  };

  // Get status display text
  const getStatusText = (message: MandrillMessage): string => {
    if (message.clicks > 0) return 'Clicked';
    if (message.opens > 0) return 'Opened';
    return message.state.charAt(0).toUpperCase() + message.state.slice(1);
  };

  // Format date for display
  const formatDate = (ts: number): string => {
    const date = new Date(ts * 1000);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 1) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    return format(date, 'MMM d, h:mm a');
  };

  // Truncate text
  const truncate = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Handle row click
  const handleRowClick = (message: MandrillMessage) => {
    setSelectedMessage(message);
    setIsDetailOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-4 sm:py-6">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:max-w-sm">
            <Input
              type="text"
              placeholder="Search messages..."
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
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
            onClick={fetchMessages}
            disabled={loading}
            variant="icon"
            size="icon"
            title="Refresh Messages"
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

        <ActivityFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
          availableTags={availableTags}
          availableSenders={availableSenders}
        />
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Outbound Activity</CardTitle>
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
              <div className="max-h-[calc(100vh-20rem)] overflow-y-auto overflow-x-auto">
                <Table className="w-full">
                  <TableHeader className="sticky top-0 bg-background z-10 border-b">
                    <TableRow>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort('ts')}
                      >
                        Date{renderSortIndicator('ts')}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort('email')}
                      >
                        Recipient{renderSortIndicator('email')}
                      </TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort('sender')}
                      >
                        Sender{renderSortIndicator('sender')}
                      </TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort('state')}
                      >
                        Status{renderSortIndicator('state')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedMessages.map((message) => (
                      <TableRow
                        key={message._id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(message)}
                      >
                        <TableCell className="text-sm">
                          {formatDate(message.ts)}
                        </TableCell>
                        <TableCell className="font-medium" title={message.email}>
                          {truncate(message.email, 25)}
                        </TableCell>
                        <TableCell title={message.subject}>
                          {truncate(message.subject, 40)}
                        </TableCell>
                        <TableCell>{truncate(message.sender, 20)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {message.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {message.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs" title={message.tags.slice(2).join(', ')}>
                                +{message.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(message)}>
                            {getStatusText(message)}
                          </Badge>
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
                itemName="messages"
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
