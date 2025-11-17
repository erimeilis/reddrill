'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { IconSettings } from '@tabler/icons-react';
import { TranslationSettings } from '@/components/translation/translation-settings';
import { AuditSettingsComponent } from '@/components/audit/audit-settings';
import { LocaleSelector } from '@/components/settings/locale-selector';

export function SettingsDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="icon"
          size="icon"
          aria-label="Settings"
          title="Settings"
        >
          <IconSettings size={20} stroke={1.5} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure translation providers, locale preferences, audit trail, and other settings
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="translation" className="py-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="translation">Translation</TabsTrigger>
            <TabsTrigger value="locales">Locales</TabsTrigger>
            <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          </TabsList>
          <TabsContent value="translation" className="mt-4">
            <TranslationSettings />
          </TabsContent>
          <TabsContent value="locales" className="mt-4">
            <LocaleSelector />
          </TabsContent>
          <TabsContent value="audit" className="mt-4">
            <AuditSettingsComponent />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
