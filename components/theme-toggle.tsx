'use client';

import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { IconMoon, IconSun } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only show the toggle after mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Render both icons but hide one with CSS
  // This ensures the same HTML structure on both server and client
  return (
    <Button
      variant="icon"
      size="icon"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      aria-label="Toggle theme"
    >
      <div className="relative">
        <div className={`absolute transition-opacity ${mounted && theme === 'light' ? 'opacity-100' : 'opacity-0'}`}>
          <IconMoon size={20} stroke={1.5} />
        </div>
        <div className={`transition-opacity ${mounted && theme === 'dark' ? 'opacity-100' : 'opacity-0'}`}>
          <IconSun size={20} stroke={1.5} />
        </div>
      </div>
    </Button>
  );
}
