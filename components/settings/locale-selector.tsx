'use client';

import { useState, useMemo } from 'react';
import { useSettingsStore } from '@/lib/store/useSettingsStore';
import { SUPPORTED_LOCALES, getLocaleFlag } from '@/lib/constants/locales';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IconCheck, IconSearch, IconX } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

export function LocaleSelector() {
  const { selectedLocales, toggleLocale, setSelectedLocales } = useSettingsStore();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter locales based on search
  const filteredLocales = useMemo(() => {
    if (!searchTerm.trim()) return SUPPORTED_LOCALES;

    const term = searchTerm.toLowerCase();
    return SUPPORTED_LOCALES.filter(locale =>
      locale.code.toLowerCase().includes(term) ||
      locale.name.toLowerCase().includes(term) ||
      locale.nativeName?.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  // Group locales by selection status
  const { selected, unselected } = useMemo(() => {
    const selected = filteredLocales.filter(l => selectedLocales.includes(l.code));
    const unselected = filteredLocales.filter(l => !selectedLocales.includes(l.code));
    return { selected, unselected };
  }, [filteredLocales, selectedLocales]);

  const handleSelectAll = () => {
    setSelectedLocales(SUPPORTED_LOCALES.map(l => l.code));
  };

  const handleClearAll = () => {
    setSelectedLocales([]);
  };

  return (
    <div className="space-y-4">
      {/* Search and bulk actions */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" stroke={1.5} />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search locales..."
            className="pl-9 pr-8"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <IconX size={16} stroke={1.5} />
            </button>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleSelectAll}>
          Select All
        </Button>
        <Button variant="outline" size="sm" onClick={handleClearAll}>
          Clear All
        </Button>
      </div>

      {/* Selected count */}
      <div className="text-sm text-muted-foreground">
        {selectedLocales.length} of {SUPPORTED_LOCALES.length} locales selected
      </div>

      {/* Locale grid */}
      <div className="max-h-[500px] overflow-y-auto border rounded-lg p-4">
        {/* Selected locales first */}
        {selected.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Selected</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {selected.map(locale => (
                <LocaleCard
                  key={locale.code}
                  locale={locale}
                  isSelected={true}
                  onToggle={() => toggleLocale(locale.code)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Unselected locales */}
        {unselected.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Available</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {unselected.map(locale => (
                <LocaleCard
                  key={locale.code}
                  locale={locale}
                  isSelected={false}
                  onToggle={() => toggleLocale(locale.code)}
                />
              ))}
            </div>
          </div>
        )}

        {/* No results */}
        {filteredLocales.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No locales found matching "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
}

interface LocaleCardProps {
  locale: { code: string; name: string; nativeName?: string };
  isSelected: boolean;
  onToggle: () => void;
}

function LocaleCard({ locale, isSelected, onToggle }: LocaleCardProps) {
  const flag = getLocaleFlag(locale.code);

  return (
    <button
      onClick={onToggle}
      className={cn(
        'flex items-center gap-3 p-3 rounded-md border transition-all',
        'hover:border-primary hover:bg-accent/50',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border bg-background'
      )}
    >
      {/* Checkbox indicator */}
      <div
        className={cn(
          'flex items-center justify-center w-5 h-5 rounded border-2 transition-colors',
          isSelected
            ? 'bg-primary border-primary text-primary-foreground'
            : 'border-muted-foreground/30'
        )}
      >
        {isSelected && <IconCheck size={14} stroke={2.5} />}
      </div>

      {/* Flag */}
      <span className="text-2xl">{flag}</span>

      {/* Locale info */}
      <div className="flex-1 text-left">
        <div className="text-sm font-medium">{locale.name}</div>
        <div className="text-xs text-muted-foreground">
          {locale.code.toUpperCase()}
          {locale.nativeName && locale.nativeName !== locale.name && (
            <span> • {locale.nativeName}</span>
          )}
        </div>
      </div>
    </button>
  );
}
