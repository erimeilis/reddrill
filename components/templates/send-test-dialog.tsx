'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { IconMail, IconCircleCheck, IconAlertCircle, IconLoader } from '@tabler/icons-react';
import type { TestData } from './test-data-form';

interface SendTestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  templateSlug: string;
  testData: TestData;
}

export function SendTestDialog({ isOpen, onClose, templateSlug, testData }: SendTestDialogProps) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!recipientEmail.trim()) {
      setError('Please enter a recipient email');
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/templates/${templateSlug}/send-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mergeVars: testData.mergeVars,
          globalVars: testData.globalVars,
          recipientEmail: recipientEmail.trim(),
          recipientName: recipientName.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send test email');
      }

      const result = await response.json();
      setSuccess(true);

      // Auto-close after 2 seconds on success
      setTimeout(() => {
        onClose();
        // Reset state after close animation
        setTimeout(() => {
          setSuccess(false);
          setRecipientEmail('');
          setRecipientName('');
        }, 300);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send test email');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending) {
      onClose();
      // Reset state after close animation
      setTimeout(() => {
        setError(null);
        setSuccess(false);
        setRecipientEmail('');
        setRecipientName('');
      }, 300);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconMail size={20} stroke={1.5} />
            Send Test Email
          </DialogTitle>
          <DialogDescription>
            Send a test email with the current test data
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <IconCircleCheck className="h-4 w-4 text-green-600 dark:text-green-400" stroke={1.5} />
            <AlertDescription className="text-green-700 dark:text-green-300">
              Test email sent successfully to {recipientEmail}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recipient-email">Recipient Email *</Label>
              <Input
                id="recipient-email"
                type="email"
                placeholder="test@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                disabled={sending}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient-name">Recipient Name (optional)</Label>
              <Input
                id="recipient-name"
                type="text"
                placeholder="Test User"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                disabled={sending}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <IconAlertCircle className="h-4 w-4" stroke={1.5} />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
              <strong>Note:</strong> This will send a real email using Mandrill. Make sure you're
              sending to a test address you control.
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={sending}>
            {success ? 'Close' : 'Cancel'}
          </Button>
          {!success && (
            <Button onClick={handleSend} disabled={sending || !recipientEmail.trim()}>
              {sending ? (
                <>
                  <IconLoader className="mr-2 h-4 w-4 animate-spin" stroke={1.5} />
                  Sending...
                </>
              ) : (
                <>
                  <IconMail className="mr-2 h-4 w-4" stroke={1.5} />
                  Send Test
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
