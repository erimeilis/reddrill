'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { IconRefresh, IconEye } from '@tabler/icons-react';
import { MandrillSender, MandrillSenderInfo } from '@/lib/api/mandrill';
import { useMandrillConnection } from '@/lib/hooks/useMandrillConnection';
import { useMandrillStore } from '@/lib/store/useMandrillStore';
import { PageHeader } from '@/components/ui/page-header';
import { SearchWithActions } from '@/components/ui/search-with-actions';
import { SenderDetailDialog } from '@/components/senders/sender-detail-dialog';

export default function SendersPage() {
  // Require authentication - redirect to home if not logged in
  useMandrillConnection(true);

  // Local UI state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<keyof MandrillSender>('address');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedSender, setSelectedSender] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [senderDetail, setSenderDetail] = useState<MandrillSenderInfo | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Local data state
  const [senders, setSenders] = useState<MandrillSender[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch senders from API
  const fetchSenders = useCallback(async () => {
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
          action: 'listSenders'
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch senders');
      }

      setSenders(result.senders);
    } catch (err) {
      console.error('Error fetching senders:', err);
      setError('Failed to fetch senders');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get sender info
  const getSenderInfo = useCallback(async (address: string): Promise<MandrillSenderInfo> => {
    const apiKey = useMandrillStore.getState().apiKey;

    if (!apiKey) {
      setError('Not connected to Mandrill');
      throw new Error('Not connected to Mandrill');
    }

    try {
      const response = await fetch('/api/mandrill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          action: 'getSenderInfo',
          address
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch sender info');
      }

      return result.sender;
    } catch (err) {
      console.error('Error fetching sender info:', err);
      setError('Failed to fetch sender info');
      throw err;
    }
  }, []);

  // Load senders on component mount
  useEffect(() => {
    fetchSenders();
  }, [fetchSenders]);

  // Reset to page 1 when search or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortField, sortDirection]);

  // Filter senders based on search term
  const filteredSenders = senders.filter(sender =>
    sender.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort senders based on sort field and direction
  const sortedSenders = [...filteredSenders].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (aValue === undefined || bValue === undefined) return 0;
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedSenders.length / itemsPerPage);
  const paginatedSenders = sortedSenders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Toggle sort direction or change sort field
  const handleSort = (field: keyof MandrillSender) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Render sort indicator
  const renderSortIndicator = (field: keyof MandrillSender) => {
    if (field !== sortField) return null;
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  // Handle viewing sender details
  const handleViewSenderDetails = async (address: string) => {
    setSelectedSender(address);
    setIsDetailOpen(true);

    try {
      const info = await getSenderInfo(address);
      setSenderDetail(info);
    } catch (error) {
      console.error('Error getting sender info:', error);
      setSenderDetail(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-4 sm:py-6">
      <PageHeader
        title="Senders"
        actions={
          <SearchWithActions
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search senders..."
            actions={
              <Button
                onClick={fetchSenders}
                disabled={loading}
                variant="icon"
                size="icon"
                title="Refresh Senders"
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
              <CardTitle>Senders</CardTitle>
              <CardDescription>
                {sortedSenders.length} senders found
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
          ) : sortedSenders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No senders found
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
                      className="cursor-pointer w-1/3"
                      onClick={() => handleSort('address')}
                    >
                      Address{renderSortIndicator('address')}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort('created_at')}
                    >
                      Created{renderSortIndicator('created_at')}
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
                  {paginatedSenders.map((sender) => (
                    <TableRow key={sender.address}>
                      <TableCell className="font-medium">{sender.address}</TableCell>
                      <TableCell>{new Date(Number(sender.created_at) * 1000).toLocaleDateString()}</TableCell>
                      <TableCell>{sender.sent}</TableCell>
                      <TableCell>{sender.hard_bounces}</TableCell>
                      <TableCell>{sender.soft_bounces}</TableCell>
                      <TableCell>{sender.rejects}</TableCell>
                      <TableCell>{sender.complaints}</TableCell>
                      <TableCell>{sender.unsubs}</TableCell>
                      <TableCell>{sender.opens}</TableCell>
                      <TableCell>{sender.clicks}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleViewSenderDetails(sender.address)}
                          title="View Sender Details"
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
                totalItems={sortedSenders.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(newItemsPerPage) => {
                  setItemsPerPage(newItemsPerPage);
                  setCurrentPage(1);
                }}
                itemName="senders"
              />
            </>
          )}
        </CardContent>
      </Card>

      <SenderDetailDialog
        sender={senderDetail}
        senderAddress={selectedSender}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        loading={loading}
      />
    </div>
  );
}
