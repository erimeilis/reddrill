'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IconMail, IconEye, IconPointer, IconServer, IconTag } from '@tabler/icons-react';
import { MandrillMessage } from '@/lib/api/mandrill';
import { format } from 'date-fns';

interface MessageDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  message: MandrillMessage | null;
}

export function MessageDetailDialog({ isOpen, onClose, message }: MessageDetailDialogProps) {
  if (!message) return null;

  const getStatusVariant = (): 'default' | 'secondary' | 'destructive' => {
    if (message.clicks > 0) return 'default';
    if (message.opens > 0) return 'default';
    if (message.state === 'sent') return 'default';
    if (message.state === 'bounced' || message.state === 'rejected') return 'destructive';
    return 'secondary';
  };

  const getStatusText = (): string => {
    if (message.clicks > 0) return 'Clicked';
    if (message.opens > 0) return 'Opened';
    return message.state.charAt(0).toUpperCase() + message.state.slice(1);
  };

  const formatTimestamp = (ts: number): string => {
    return format(new Date(ts * 1000), 'MMM d, yyyy h:mm:ss a');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconMail size={20} stroke={1.5} />
            Message Details
          </DialogTitle>
          <DialogDescription>
            View complete message information and activity
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Message Header */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Message Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Recipient</div>
                  <div className="text-sm font-mono">{message.email}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Sender</div>
                  <div className="text-sm font-mono">{message.sender}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Sent</div>
                  <div className="text-sm">{formatTimestamp(message.ts)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Status</div>
                  <div>
                    <Badge variant={getStatusVariant()}>
                      {getStatusText()}
                    </Badge>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Subject</div>
                <div className="text-sm">{message.subject}</div>
              </div>
              {message.tags.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Tags</div>
                  <div className="flex flex-wrap gap-1">
                    {message.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        <IconTag size={12} className="mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Opens Detail */}
          {message.opens_detail && message.opens_detail.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <IconEye size={18} stroke={1.5} />
                  Opens ({message.opens})
                </CardTitle>
                <CardDescription>
                  Email open events with location and device information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {message.opens_detail.map((open, index) => (
                    <div key={index} className="p-3 bg-muted rounded-lg">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Time:</span>{' '}
                          {formatTimestamp(open.ts)}
                        </div>
                        <div>
                          <span className="font-medium">IP:</span>{' '}
                          <span className="font-mono text-xs">{open.ip}</span>
                        </div>
                        {open.location && (
                          <div className="sm:col-span-2">
                            <span className="font-medium">Location:</span> {open.location}
                          </div>
                        )}
                        {open.ua && (
                          <div className="sm:col-span-2">
                            <span className="font-medium">User Agent:</span>{' '}
                            <span className="font-mono text-xs">{open.ua}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Clicks Detail */}
          {message.clicks_detail && message.clicks_detail.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <IconPointer size={18} stroke={1.5} />
                  Clicks ({message.clicks})
                </CardTitle>
                <CardDescription>
                  Link click events with URLs and timestamps
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {message.clicks_detail.map((click, index) => (
                    <div key={index} className="p-3 bg-muted rounded-lg">
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Time:</span>{' '}
                          {formatTimestamp(click.ts)}
                        </div>
                        <div className="break-all">
                          <span className="font-medium">URL:</span>{' '}
                          <a
                            href={click.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline font-mono text-xs"
                          >
                            {click.url}
                          </a>
                        </div>
                        {click.ip && (
                          <div>
                            <span className="font-medium">IP:</span>{' '}
                            <span className="font-mono text-xs">{click.ip}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* SMTP Events */}
          {message.smtp_events && message.smtp_events.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <IconServer size={18} stroke={1.5} />
                  SMTP Events ({message.smtp_events.length})
                </CardTitle>
                <CardDescription>
                  Server-level delivery events and diagnostics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {message.smtp_events.map((event, index) => (
                    <div key={index} className="p-3 bg-muted rounded-lg">
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="font-medium">Time:</span>{' '}
                            {formatTimestamp(event.ts)}
                          </div>
                          <div>
                            <span className="font-medium">Type:</span>{' '}
                            <Badge variant="outline" className="text-xs">
                              {event.type}
                            </Badge>
                          </div>
                        </div>
                        {event.diag && (
                          <div>
                            <span className="font-medium">Diagnostic:</span>
                            <div className="mt-1 p-2 bg-background rounded text-xs font-mono whitespace-pre-wrap break-all">
                              {event.diag}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          {message.metadata && Object.keys(message.metadata).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Metadata</CardTitle>
                <CardDescription>
                  Custom metadata attached to this message
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-muted rounded-lg font-mono text-xs">
                  <pre className="whitespace-pre-wrap break-all">
                    {JSON.stringify(message.metadata, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
