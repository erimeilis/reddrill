'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  IconX,
  IconCheck,
  IconAlertCircle,
  IconCopy,
  IconRestore,
  IconFileExport,
} from '@tabler/icons-react';
import type { AuditLog, AuditTemplateState, AuditChange } from '@/lib/types/audit';
import { formatDistanceToNow } from 'date-fns';

interface AuditDetailModalProps {
  logId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestoreSuccess?: () => void;
}

export function AuditDetailModal({
  logId,
  open,
  onOpenChange,
  onRestoreSuccess,
}: AuditDetailModalProps) {
  const [log, setLog] = useState<AuditLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (open && logId) {
      loadLogDetails();
    } else {
      setLog(null);
      setError(null);
      setRestoreMessage(null);
    }
  }, [open, logId]);

  const loadLogDetails = async () => {
    if (!logId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/audit/logs/${logId}`);
      if (!response.ok) {
        throw new Error('Failed to load log details');
      }

      const data = await response.json();
      setLog(data.log);
    } catch (err) {
      console.error('Failed to load log details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load log details');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatJson = (json: string | null) => {
    if (!json) return null;
    try {
      return JSON.stringify(JSON.parse(json), null, 2);
    } catch {
      return json;
    }
  };

  const parseState = (stateJson: string | null): AuditTemplateState | null => {
    if (!stateJson) return null;
    try {
      return JSON.parse(stateJson);
    } catch {
      return null;
    }
  };

  const parseChanges = (changesJson: string | null): AuditChange[] | null => {
    if (!changesJson) return null;
    try {
      return JSON.parse(changesJson);
    } catch {
      return null;
    }
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

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loading Audit Log Details...</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !log) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <IconAlertCircle className="h-4 w-4" />
            <AlertDescription>{error || 'Log not found'}</AlertDescription>
          </Alert>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const stateBefore = parseState(log.stateBefore);
  const stateAfter = parseState(log.stateAfter);
  const changes = parseChanges(log.changesSummary);
  const canRestore = log.operationType === 'delete' || log.operationType === 'update';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Audit Log Details</DialogTitle>
          <DialogDescription>
            Detailed information about this template operation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Messages */}
          {restoreMessage && (
            <Alert variant={restoreMessage.type === 'error' ? 'destructive' : 'default'}>
              {restoreMessage.type === 'success' ? (
                <IconCheck className="h-4 w-4" />
              ) : (
                <IconAlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{restoreMessage.text}</AlertDescription>
            </Alert>
          )}

          {/* Summary Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-lg">{log.templateName}</CardTitle>
                  <CardDescription className="space-x-2">
                    {getOperationBadge(log.operationType)}
                    {getStatusBadge(log.operationStatus)}
                    {log.bulkOperation === 1 && (
                      <Badge variant="outline">
                        Bulk ({log.bulkSuccessCount}/{log.bulkTotalCount})
                      </Badge>
                    )}
                  </CardDescription>
                </div>
                <div className="text-sm text-muted-foreground text-right">
                  <div>{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}</div>
                  <div className="font-mono text-xs mt-1">{log.createdAt}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {log.templateSlug && (
                <div>
                  <strong>Slug:</strong> <code className="text-sm">{log.templateSlug}</code>
                </div>
              )}
              {log.userIdentifier && (
                <div>
                  <strong>User:</strong> {log.userIdentifier}
                </div>
              )}
              {log.operationId && (
                <div>
                  <strong>Operation ID:</strong> <code className="text-sm">{log.operationId}</code>
                </div>
              )}
              {log.errorMessage && (
                <Alert variant="destructive">
                  <IconAlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Error:</strong> {log.errorMessage}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Tabs for Details */}
          <Tabs defaultValue="changes" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="changes">Changes</TabsTrigger>
              <TabsTrigger value="before">Before</TabsTrigger>
              <TabsTrigger value="after">After</TabsTrigger>
              <TabsTrigger value="raw">Raw JSON</TabsTrigger>
            </TabsList>

            {/* Changes Tab */}
            <TabsContent value="changes" className="space-y-4">
              {changes && changes.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Change Summary</CardTitle>
                    <CardDescription>{changes.length} field(s) modified</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {changes.map((change, i) => (
                        <div
                          key={i}
                          className="p-3 border rounded-lg bg-muted/30"
                        >
                          <div className="font-semibold mb-2">{change.field}</div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Before</div>
                              <code className="block p-2 bg-background rounded text-xs break-words">
                                {typeof change.oldValue === 'object'
                                  ? JSON.stringify(change.oldValue, null, 2)
                                  : String(change.oldValue)}
                              </code>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">After</div>
                              <code className="block p-2 bg-background rounded text-xs break-words">
                                {typeof change.newValue === 'object'
                                  ? JSON.stringify(change.newValue, null, 2)
                                  : String(change.newValue)}
                              </code>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No detailed changes available
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Before State Tab */}
            <TabsContent value="before">
              {stateBefore ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>State Before Operation</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(formatJson(log.stateBefore) || '')}
                      >
                        <IconCopy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="p-4 bg-muted rounded-lg text-xs max-h-[500px] overflow-y-auto whitespace-pre-wrap break-all">
                      {formatJson(log.stateBefore)}
                    </pre>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No before state available
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* After State Tab */}
            <TabsContent value="after">
              {stateAfter ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>State After Operation</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(formatJson(log.stateAfter) || '')}
                      >
                        <IconCopy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="p-4 bg-muted rounded-lg text-xs max-h-[500px] overflow-y-auto whitespace-pre-wrap break-all">
                      {formatJson(log.stateAfter)}
                    </pre>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No after state available
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Raw JSON Tab */}
            <TabsContent value="raw">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Complete Audit Log (JSON)</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(JSON.stringify(log, null, 2))}
                    >
                      <IconCopy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="p-4 bg-muted rounded-lg text-xs max-h-[500px] overflow-y-auto whitespace-pre-wrap break-all">
                    {JSON.stringify(log, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            {canRestore && (
              <Button
                variant="outline"
                onClick={() => {
                  // TODO: Implement restore functionality
                  setRestoreMessage({
                    type: 'error',
                    text: 'Restore functionality not yet implemented',
                  });
                }}
                disabled={restoring}
              >
                <IconRestore className="mr-2 h-4 w-4" />
                {restoring ? 'Restoring...' : 'Restore Template'}
              </Button>
            )}
          </div>
          <Button onClick={() => onOpenChange(false)}>
            <IconX className="mr-2 h-4 w-4" />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
