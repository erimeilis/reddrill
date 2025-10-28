'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { IconX } from '@tabler/icons-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface ActivityFilters {
  dateFrom: string | null;
  dateTo: string | null;
  tag: string | null;
  sender: string | null;
  status: string | null;
  searchTerm: string;
  datePreset: string | null;
}

interface ActivityFiltersProps {
  filters: ActivityFilters;
  onFiltersChange: (filters: ActivityFilters) => void;
  availableTags: string[];
  availableSenders: string[];
}

export function ActivityFiltersComponent({
  filters,
  onFiltersChange,
  availableTags,
  availableSenders
}: ActivityFiltersProps) {
  const activeFilterCount = [
    filters.dateFrom,
    filters.dateTo,
    filters.tag,
    filters.sender,
    filters.status,
    filters.datePreset
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    onFiltersChange({
      dateFrom: null,
      dateTo: null,
      tag: null,
      sender: null,
      status: null,
      searchTerm: filters.searchTerm,
      datePreset: null
    });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full">
      {/* Status Filter */}
      <Select
        value={filters.status || 'all'}
        onValueChange={(value) => onFiltersChange({ ...filters, status: value === 'all' ? null : value })}
      >
        <SelectTrigger className="w-full sm:flex-1">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="sent">Sent</SelectItem>
          <SelectItem value="opened">Opened</SelectItem>
          <SelectItem value="clicked">Clicked</SelectItem>
          <SelectItem value="bounced">Bounced</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
          <SelectItem value="deferred">Deferred</SelectItem>
          <SelectItem value="soft-bounced">Soft Bounced</SelectItem>
          <SelectItem value="queued">Queued</SelectItem>
        </SelectContent>
      </Select>

      {/* Tag Filter */}
      <Select
        value={filters.tag || 'all'}
        onValueChange={(value) => onFiltersChange({ ...filters, tag: value === 'all' ? null : value })}
      >
        <SelectTrigger className="w-full sm:flex-1">
          <SelectValue placeholder="All tags" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All tags</SelectItem>
          {availableTags.map((tag) => (
            <SelectItem key={tag} value={tag}>
              {tag}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sender Filter */}
      <Select
        value={filters.sender || 'all'}
        onValueChange={(value) => onFiltersChange({ ...filters, sender: value === 'all' ? null : value })}
      >
        <SelectTrigger className="w-full sm:flex-1">
          <SelectValue placeholder="All senders" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All senders</SelectItem>
          {availableSenders.map((sender) => (
            <SelectItem key={sender} value={sender}>
              {sender}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear Filters Button - only takes space it needs */}
      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="h-10 whitespace-nowrap shrink-0"
        >
          <IconX size={14} className="mr-1" />
          Clear filters ({activeFilterCount})
        </Button>
      )}
    </div>
  );
}
