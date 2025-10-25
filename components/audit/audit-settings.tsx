'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconCheck, IconAlertCircle, IconTrash, IconRefresh } from '@tabler/icons-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { AuditSettings } from '@/lib/types/audit';

export function AuditSettingsComponent() {
  const [settings, setSettings] = useState<AuditSettings | null>(null);
  const [enabled, setEnabled] = useState<boolean>(false);
  const [retentionDays, setRetentionDays] = useState<number>(30);
  const [userIdentifier, setUserIdentifier] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/audit/settings');
      if (!response.ok) {
        throw new Error('Failed to load settings');
      }
      const data: AuditSettings = await response.json();
      setSettings(data);
      setEnabled(data.enabled === 1);
      setRetentionDays(data.retention_days);
      setUserIdentifier(data.user_identifier || '');
    } catch (error) {
      console.error('Failed to load audit settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const updates = {
        enabled: enabled ? 1 : 0,
        retention_days: retentionDays,
        user_identifier: userIdentifier || null,
      };

      const response = await fetch('/api/audit/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save settings');
      }

      const result = await response.json();
      setSettings(result.settings);
      setMessage({ type: 'success', text: 'Settings saved successfully' });
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save settings'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCleanup = async () => {
    if (!confirm('Are you sure you want to clean up old audit logs? This cannot be undone.')) {
      return;
    }

    setCleaning(true);
    setMessage(null);

    try {
      const response = await fetch('/api/audit/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Cleanup failed');
      }

      const result = await response.json();
      setMessage({
        type: 'success',
        text: result.message || `Deleted ${result.deleted_count} old logs`
      });
    } catch (error) {
      console.error('Failed to cleanup logs:', error);
      setMessage({ type: 'error', text: 'Failed to cleanup logs' });
    } finally {
      setCleaning(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('⚠️ WARNING: This will delete ALL audit logs permanently. Are you sure?')) {
      return;
    }

    if (!confirm('This action cannot be undone. Type "DELETE ALL" to confirm.')) {
      return;
    }

    setCleaning(true);
    setMessage(null);

    try {
      const response = await fetch('/api/audit/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clear_all: true }),
      });

      if (!response.ok) {
        throw new Error('Clear all failed');
      }

      setMessage({ type: 'success', text: 'All audit logs cleared' });
    } catch (error) {
      console.error('Failed to clear logs:', error);
      setMessage({ type: 'error', text: 'Failed to clear logs' });
    } finally {
      setCleaning(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail Settings</CardTitle>
          <CardDescription>Loading settings...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail Settings</CardTitle>
          <CardDescription>
            Configure audit logging for template operations. When enabled, all create, update, and delete operations are logged with full state snapshots.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Messages */}
          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              {message.type === 'success' ? (
                <IconCheck className="h-4 w-4" />
              ) : (
                <IconAlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {/* Enable/Disable Audit */}
          <div className="space-y-2">
            <Label htmlFor="enabled">Audit Trail Status</Label>
            <Select
              value={enabled ? 'enabled' : 'disabled'}
              onValueChange={(value) => setEnabled(value === 'enabled')}
            >
              <SelectTrigger id="enabled">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enabled">✅ Enabled - Track all operations</SelectItem>
                <SelectItem value="disabled">❌ Disabled - No tracking</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              When enabled, all template operations (create, update, delete) are logged with full state snapshots for disaster recovery.
            </p>
          </div>

          {/* Retention Days */}
          <div className="space-y-2">
            <Label htmlFor="retention">Retention Period (days)</Label>
            <Select
              value={retentionDays.toString()}
              onValueChange={(value) => setRetentionDays(parseInt(value, 10))}
            >
              <SelectTrigger id="retention">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days (default)</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="180">180 days (6 months)</SelectItem>
                <SelectItem value="365">365 days (1 year)</SelectItem>
                <SelectItem value="-1">♾️ Forever (no automatic cleanup)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Logs older than this period will be automatically cleaned up. Set to "Forever" to keep all logs indefinitely.
            </p>
          </div>

          {/* User Identifier */}
          <div className="space-y-2">
            <Label htmlFor="user_identifier">User Identifier (optional)</Label>
            <Input
              id="user_identifier"
              type="text"
              placeholder="e.g., admin@example.com or user-id-123"
              value={userIdentifier}
              onChange={(e) => setUserIdentifier(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Optional identifier to track who made changes (email, user ID, or system name).
            </p>
          </div>

          {/* Save Button */}
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <IconRefresh className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <IconCheck className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
            <Button variant="outline" onClick={loadSettings} disabled={loading}>
              <IconRefresh className="mr-2 h-4 w-4" />
              Reload
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Section */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance</CardTitle>
          <CardDescription>
            Clean up old logs or clear all audit data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCleanup}
              disabled={cleaning || !enabled}
            >
              <IconTrash className="mr-2 h-4 w-4" />
              Clean Up Old Logs
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearAll}
              disabled={cleaning}
            >
              <IconTrash className="mr-2 h-4 w-4" />
              Clear All Logs
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            <strong>Clean Up Old Logs:</strong> Removes logs older than the retention period.
            <br />
            <strong>Clear All Logs:</strong> Permanently deletes ALL audit logs (⚠️ cannot be undone).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
