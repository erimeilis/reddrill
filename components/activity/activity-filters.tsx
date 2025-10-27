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
    filters.status
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    onFiltersChange({
      dateFrom: null,
      dateTo: null,
      tag: null,
      sender: null,
      status: null,
      searchTerm: filters.searchTerm
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Date From */}
        <div>
          <Input
            type="date"
            placeholder="From date..."
            value={filters.dateFrom || ''}
            onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value || null })}
            className="w-full"
          />
        </div>

        {/* Date To */}
        <div>
          <Input
            type="date"
            placeholder="To date..."
            value={filters.dateTo || ''}
            onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value || null })}
            className="w-full"
          />
        </div>

        {/* Status Filter */}
        <div>
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => onFiltersChange({ ...filters, status: value === 'all' ? null : value })}
          >
            <SelectTrigger className="w-full">
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
        </div>

        {/* Tag Filter */}
        <div>
          <Select
            value={filters.tag || 'all'}
            onValueChange={(value) => onFiltersChange({ ...filters, tag: value === 'all' ? null : value })}
          >
            <SelectTrigger className="w-full">
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
        </div>

        {/* Sender Filter */}
        <div>
          <Select
            value={filters.sender || 'all'}
            onValueChange={(value) => onFiltersChange({ ...filters, sender: value === 'all' ? null : value })}
          >
            <SelectTrigger className="w-full">
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
