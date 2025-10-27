'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import { IconSearch, IconFilter, IconRefresh, IconFileExport, IconX } from '@tabler/icons-react';
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
    limit: 50,
    offset: 0,
    orderBy: 'createdAt',
    orderDir: 'DESC',
  });
  const [showFilters, setShowFilters] = useState(false);
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
      setTotalCount(data.totalCount || data.logs?.length || 0);
    } catch (err) {
      console.error('Search failed:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilter({
      limit: 50,
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
      <div className="space-y-4">
      {/* Header with Search */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>
                View and search template operation history
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <IconFilter className="mr-2 h-4 w-4" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadLogs}
                disabled={loading}
              >
                <IconRefresh className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search logs (template name, operation, labels)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              <IconSearch className="mr-2 h-4 w-4" />
              Search
            </Button>
            {(searchQuery || filter.operationType || filter.status) && (
              <Button variant="outline" onClick={clearFilters}>
                <IconX className="mr-2 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label>Operation Type</Label>
                <Select
                  value={filter.operationType || 'all'}
                  onValueChange={(value) =>
                    setFilter({ ...filter, operationType: value === 'all' ? undefined : value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Operations</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                    <SelectItem value="restore">Restore</SelectItem>
                    <SelectItem value="import">Import</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filter.status || 'all'}
                  onValueChange={(value) =>
                    setFilter({ ...filter, status: value === 'all' ? undefined : value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="failure">Failure</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Results Per Page</Label>
                <Select
                  value={filter.limit?.toString() || '50'}
                  onValueChange={(value) =>
                    setFilter({ ...filter, limit: parseInt(value), offset: 0 })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Results Count */}
          <div className="text-sm text-muted-foreground">
            Showing {logs.length} log{logs.length !== 1 ? 's' : ''}
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent>
          <div className="max-h-[calc(100vh-28rem)] overflow-y-auto overflow-x-auto">
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
                      <TableCell className="font-mono text-xs">
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
                        {log.templateSlug && (
                          <div className="text-xs text-muted-foreground truncate">
                            {log.templateSlug}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(log.operationStatus)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {log.userIdentifier || '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLogId(log.id);
                            setModalOpen(true);
                          }}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {logs.length > 0 && (
        <Pagination
          currentPage={Math.floor((filter.offset || 0) / (filter.limit || 50)) + 1}
          totalPages={Math.ceil(totalCount / (filter.limit || 50))}
          totalItems={totalCount}
          itemsPerPage={filter.limit || 50}
          onPageChange={(page) => setFilter({ ...filter, offset: (page - 1) * (filter.limit || 50) })}
          itemName="logs"
        />
      )}

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
    </div>
  );
}
