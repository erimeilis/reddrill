import { ReactNode } from 'react';
import { Input } from '@/components/ui/input';

interface SearchWithActionsProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  actions?: ReactNode;
}

export function SearchWithActions({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  actions,
}: SearchWithActionsProps) {
  return (
    <>
      <div className="relative w-full sm:w-80">
        <Input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pr-10"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
          </svg>
        </div>
      </div>
      {actions}
    </>
  );
}
