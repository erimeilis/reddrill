'use client';

import { Button } from '@/components/ui/button';
import { IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight } from '@tabler/icons-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  itemName?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  itemName = 'items'
}: PaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const handleFirst = () => onPageChange(1);
  const handlePrevious = () => onPageChange(Math.max(1, currentPage - 1));
  const handleNext = () => onPageChange(Math.min(totalPages, currentPage + 1));
  const handleLast = () => onPageChange(totalPages);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) {
    return (
      <div className="flex items-center justify-between px-2 py-3">
        <div className="text-sm text-muted-foreground">
          Showing {totalItems} {itemName}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-3">
      <div className="text-sm text-muted-foreground">
        Showing {startItem} to {endItem} of {totalItems} {itemName}
      </div>

      <div className="flex items-center gap-2">
        {/* First and Previous */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={handleFirst}
            disabled={!canGoPrevious}
            aria-label="First page"
            className="h-8 w-8"
          >
            <IconChevronsLeft size={16} stroke={1.5} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevious}
            disabled={!canGoPrevious}
            aria-label="Previous page"
            className="h-8 w-8"
          >
            <IconChevronLeft size={16} stroke={1.5} />
          </Button>
        </div>

        {/* Page Numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                  ...
                </span>
              );
            }

            return (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(page as number)}
                className="h-8 w-8 p-0"
              >
                {page}
              </Button>
            );
          })}
        </div>

        {/* Mobile: Just show current page */}
        <div className="flex sm:hidden items-center">
          <span className="text-sm px-3">
            Page {currentPage} of {totalPages}
          </span>
        </div>

        {/* Next and Last */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={!canGoNext}
            aria-label="Next page"
            className="h-8 w-8"
          >
            <IconChevronRight size={16} stroke={1.5} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleLast}
            disabled={!canGoNext}
            aria-label="Last page"
            className="h-8 w-8"
          >
            <IconChevronsRight size={16} stroke={1.5} />
          </Button>
        </div>
      </div>
    </div>
  );
}
