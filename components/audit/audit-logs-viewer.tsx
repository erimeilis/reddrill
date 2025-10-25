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
import { IconSearch, IconFilter, IconRefresh, IconFileExport, IconX } from '@tabler/icons-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { AuditLog, AuditLogFilter } from '@/lib/types/audit';
import { formatDistanceToNow } from 'date-fns';

export function AuditLogsViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<AuditLogFilter>({
    limit: 50,
    offset: 0,
    order_by: 'created_at',
    order_dir: 'DESC',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadLogs();
  }, [filter]);

  const loadLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filter.operation_type) params.set('operation_type', filter.operation_type);
      if (filter.template_name) params.set('template_name', filter.template_name);
      if (filter.status) params.set('status', filter.status);
      if (filter.date_from) params.set('date_from', filter.date_from);
      if (filter.date_to) params.set('date_to', filter.date_to);
      if (filter.limit) params.set('limit', filter.limit.toString());
      if (filter.offset) params.set('offset', filter.offset.toString());
      if (filter.order_by) params.set('order_by', filter.order_by);
      if (filter.order_dir) params.set('order_dir', filter.order_dir);

      const response = await fetch(`/api/audit/logs?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to load logs');
      }

      const data = await response.json();
      setLogs(data.logs || []);
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
      const response = await fetch('/api/audit/logs/search', {
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
      order_by: 'created_at',
      order_dir: 'DESC',
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
    const colors: Record<string, string> = {
      success: '✅',
      partial: '⚠️',
      failure: '❌',
    };
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {colors[status]} {status}
      </Badge>
    );
  };

  if (loading && logs.length === 0) {
    return (
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
    );
  }

  return (
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
            {(searchQuery || filter.operation_type || filter.status) && (
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
                  value={filter.operation_type || 'all'}
                  onValueChange={(value) =>
                    setFilter({ ...filter, operation_type: value === 'all' ? undefined : value as any })
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
        <CardContent className="p-0">
          <Table>
            <TableHeader>
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
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      {getOperationBadge(log.operation_type)}
                      {log.bulk_operation === 1 && (
                        <Badge variant="outline" className="ml-2">
                          Bulk
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {log.template_name}
                      {log.template_slug && (
                        <div className="text-xs text-muted-foreground truncate">
                          {log.template_slug}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(log.operation_status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate max-w-[150px]">
                      {log.user_identifier || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // TODO: Open detail modal
                          console.log('View details:', log.id);
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
        </CardContent>
      </Card>

      {/* Pagination */}
      {logs.length > 0 && (
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setFilter({ ...filter, offset: Math.max(0, (filter.offset || 0) - (filter.limit || 50)) })}
            disabled={!filter.offset || filter.offset === 0}
          >
            Previous
          </Button>
          <div className="text-sm text-muted-foreground">
            Offset: {filter.offset || 0}
          </div>
          <Button
            variant="outline"
            onClick={() => setFilter({ ...filter, offset: (filter.offset || 0) + (filter.limit || 50) })}
            disabled={logs.length < (filter.limit || 50)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
