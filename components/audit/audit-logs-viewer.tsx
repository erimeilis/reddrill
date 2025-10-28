'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import { IconRefresh, IconFileExport, IconX, IconFileText } from '@tabler/icons-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { AuditLog, AuditLogFilter } from '@/lib/types/audit';
import { formatDistanceToNow } from 'date-fns';
import { AuditDetailModal } from './audit-detail-modal';
import { useAuditApi } from '@/lib/hooks/useAuditApi';

export function AuditLogsViewer() {
  const { auditFetch, hasApiKey } = useAuditApi();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<AuditLogFilter>({
    limit: 10,
    offset: 0,
    orderBy: 'createdAt',
    orderDir: 'DESC',
  });
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadLogs();
  }, [filter]);

  const loadLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filter.operationType) params.set('operation_type', filter.operationType);
      if (filter.templateName) params.set('template_name', filter.templateName);
      if (filter.status) params.set('status', filter.status);
      if (filter.dateFrom) params.set('date_from', filter.dateFrom);
      if (filter.dateTo) params.set('date_to', filter.dateTo);
      if (filter.limit) params.set('limit', filter.limit.toString());
      if (filter.offset) params.set('offset', filter.offset.toString());
      if (filter.orderBy) params.set('order_by', filter.orderBy);
      if (filter.orderDir) params.set('order_dir', filter.orderDir);

      const response = await auditFetch(`/api/audit/logs?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to load logs');
      }

      const data = await response.json();
      setLogs(data.logs || []);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadLogs();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await auditFetch('/api/audit/logs/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          filter,
        }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setLogs(data.logs || []);
      setTotalCount(data.totalCount || data.count || data.logs?.length || 0);
    } catch (err) {
      console.error('Search failed:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilter({
      limit: 10,
      offset: 0,
      orderBy: 'createdAt',
      orderDir: 'DESC',
    });
    setSearchQuery('');
  };

  const getOperationBadge = (operation: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      create: 'default',
      update: 'secondary',
      delete: 'destructive',
      restore: 'outline',
      import: 'outline',
    };
    return <Badge variant={variants[operation] || 'outline'}>{operation}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      success: 'default',
      partial: 'secondary',
      failure: 'destructive',
    };
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  if (loading && logs.length === 0) {
    return (
      <div className="container mx-auto px-4 py-4 sm:py-6">
        <Card>
          <CardHeader>
            <CardTitle>Audit Logs</CardTitle>
            <CardDescription>Loading logs...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:py-6">
      {/* Title and Controls Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between mb-6">
        {/* Page Title */}
        <h1 className="text-2xl font-bold whitespace-nowrap">Audit Logs</h1>

        {/* Right side: Search + Filters + Refresh */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Input
              placeholder="Search logs (template name, operation, labels)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              className="w-full pr-10"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </svg>
            </div>
          </div>

          {/* Operation Type Filter */}
          <Select
            value={filter.operationType || 'all'}
            onValueChange={(value) =>
              setFilter({ ...filter, operationType: value === 'all' ? undefined : value as any })
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All operations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All operations</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="restore">Restore</SelectItem>
              <SelectItem value="import">Import</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select
            value={filter.status || 'all'}
            onValueChange={(value) =>
              setFilter({ ...filter, status: value === 'all' ? undefined : value as any })
            }
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="failure">Failure</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters Button */}
          {(searchQuery || filter.operationType || filter.status) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-10 whitespace-nowrap shrink-0"
            >
              <IconX size={14} className="mr-1" />
              Clear filters
            </Button>
          )}

          {/* Refresh button */}
          <Button
            variant="icon"
            size="icon"
            onClick={loadLogs}
            disabled={loading}
            title="Refresh Logs"
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
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent>
          <div
            className="overflow-y-auto overflow-x-auto"
            style={{ maxHeight: `${Math.min((filter.limit || 10) * 60 + 60, 800)}px` }}
          >
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10 border-b">
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Operation</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono">
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        {getOperationBadge(log.operationType)}
                        {log.bulkOperation === 1 && (
                          <Badge variant="outline" className="ml-2">
                            Bulk
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.templateName}
                      </TableCell>
                      <TableCell>{getStatusBadge(log.operationStatus)}</TableCell>
                      <TableCell className="text-muted-foreground truncate max-w-[150px]">
                        {log.userIdentifier || '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setSelectedLogId(log.id);
                            setModalOpen(true);
                          }}
                          title="View Details"
                        >
                          <IconFileText size={14} stroke={1.5} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalCount > 0 && (
            <Pagination
              currentPage={Math.floor((filter.offset || 0) / (filter.limit || 10)) + 1}
              totalPages={Math.ceil(totalCount / (filter.limit || 10))}
              totalItems={totalCount}
              itemsPerPage={filter.limit || 10}
              onPageChange={(page) => setFilter({ ...filter, offset: (page - 1) * (filter.limit || 10) })}
              onItemsPerPageChange={(itemsPerPage) => setFilter({ ...filter, limit: itemsPerPage, offset: 0 })}
              itemName="logs"
            />
          )}
        </CardContent>
      </Card>

      {/* Audit Detail Modal */}
      <AuditDetailModal
        logId={selectedLogId}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onRestoreSuccess={() => {
          setModalOpen(false);
          loadLogs();
        }}
      />
    </div>
  );
}
