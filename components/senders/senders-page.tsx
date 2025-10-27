'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { IconRefresh, IconEye } from '@tabler/icons-react';
import { MandrillSender, MandrillSenderInfo } from '@/lib/api/mandrill';
import mandrillClient from '@/lib/api/mandrill';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMandrillConnection } from '@/lib/hooks/useMandrillConnection';

export function SendersPage() {
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
  const [itemsPerPage] = useState<number>(10);

  // Local data state
  const [senders, setSenders] = useState<MandrillSender[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch senders from API
  const fetchSenders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mandrillClient.listSenders();
      setSenders(data);
    } catch (err) {
      console.error('Error fetching senders:', err);
      setError('Failed to fetch senders');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get sender info
  const getSenderInfo = useCallback(async (address: string): Promise<MandrillSenderInfo> => {
    try {
      const info = await mandrillClient.getSenderInfo(address);
      return info;
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
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="relative w-full sm:max-w-sm">
          <Input
            type="text"
            placeholder="Search senders..."
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
          onClick={fetchSenders} 
          disabled={loading} 
          variant="icon"
          size="icon"
          title="Refresh Senders"
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
              <div className="max-h-[calc(100vh-20rem)] overflow-y-auto overflow-x-auto">
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
                          size="icon"
                          onClick={() => handleViewSenderDetails(sender.address)}
                          title="View Sender Details"
                        >
                          <IconEye size={18} stroke={1.5} />
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
                itemName="senders"
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Sender Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Sender Details: {selectedSender}</DialogTitle>
            <DialogDescription>
              Detailed information about this sender
            </DialogDescription>
          </DialogHeader>

          {senderDetail ? (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="font-medium">Total Sent:</dt>
                        <dd>{senderDetail.sent}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium">Last 30 Days Sent:</dt>
                        <dd>{senderDetail.stats.last_30_days.sent}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium">Last 30 Days Opens:</dt>
                        <dd>{senderDetail.stats.last_30_days.opens}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium">Last 30 Days Clicks:</dt>
                        <dd>{senderDetail.stats.last_30_days.clicks}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium">Last 7 Days Sent:</dt>
                        <dd>{senderDetail.stats.last_7_days.sent}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>DKIM</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="font-medium">Signed By:</dt>
                        <dd>{senderDetail.dkim.signed_by || 'None'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium">Valid:</dt>
                        <dd>{senderDetail.dkim.valid ? 'Yes' : 'No'}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>SPF</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="font-medium">Valid:</dt>
                      <dd>{senderDetail.spf.valid ? 'Yes' : 'No'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="font-medium">Valid With DKIM:</dt>
                      <dd>{senderDetail.spf.valid_with_dkim ? 'Yes' : 'No'}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              {loading ? (
                <div className="flex justify-center items-center">
                  <svg className="animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading sender details...
                </div>
              ) : (
                <div>Error loading sender details. Please try again.</div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
