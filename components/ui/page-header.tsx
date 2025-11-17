import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:justify-between mb-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold whitespace-nowrap">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      {/* Actions */}
      {actions && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
