'use client';

import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { IconMoon, IconSun } from '@tabler/icons-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="icon"
      size="icon"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <IconMoon size={20} stroke={1.5} />
      ) : (
        <IconSun size={20} stroke={1.5} />
      )}
    </Button>
  );
}
