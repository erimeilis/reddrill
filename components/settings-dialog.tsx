'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { IconSettings } from '@tabler/icons-react';
import { TranslationSettings } from '@/components/translation/translation-settings';

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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure translation providers and other settings
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <TranslationSettings />
        </div>
      </DialogContent>
    </Dialog>
  );
}
