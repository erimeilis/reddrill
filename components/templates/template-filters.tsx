'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { IconX } from '@tabler/icons-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getLocaleFlag } from '@/lib/constants/locales';

export interface TemplateFilters {
  theme: string;
  label: string;
  locale: string;
}

interface TemplateFiltersProps {
  filters: TemplateFilters;
  onFiltersChange: (filters: TemplateFilters) => void;
  availableLocales: string[];
}

export function TemplateFiltersComponent({ filters, onFiltersChange, availableLocales }: TemplateFiltersProps) {
  const activeFilterCount = [filters.theme, filters.label, filters.locale].filter(Boolean).length;

  const handleClearFilters = () => {
    onFiltersChange({ theme: '', label: '', locale: '' });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Input
            type="text"
            placeholder="Filter by theme..."
            value={filters.theme}
            onChange={(e) => onFiltersChange({ ...filters, theme: e.target.value })}
            className="w-full"
          />
        </div>

        <div>
          <Input
            type="text"
            placeholder="Filter by label..."
            value={filters.label}
            onChange={(e) => onFiltersChange({ ...filters, label: e.target.value })}
            className="w-full"
          />
        </div>

        <div>
          <Select
            value={filters.locale}
            onValueChange={(value) => onFiltersChange({ ...filters, locale: value === 'all' ? '' : value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All locales" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locales</SelectItem>
              {availableLocales.map((locale) => (
                <SelectItem key={locale} value={locale}>
                  <span className="flex items-center gap-2">
                    <span>{getLocaleFlag(locale)}</span>
                    <span>{locale.toUpperCase()}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-8"
          >
            <IconX size={14} className="mr-1" />
            Clear filters ({activeFilterCount})
          </Button>
        </div>
      )}
    </div>
  );
}
