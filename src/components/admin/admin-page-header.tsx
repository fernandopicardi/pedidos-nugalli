import type { ReactNode } from 'react';

interface AdminPageHeaderProps {
  title: string;
  actionButton?: ReactNode;
}

export function AdminPageHeader({ title, actionButton }: AdminPageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <h1 className="text-3xl font-headline font-semibold">{title}</h1>
      {actionButton}
    </div>
  );
}
