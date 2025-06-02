
import type { ReactNode } from 'react';
import { AdminLayoutWrapper } from '@/components/layout/admin-sidebar';

// This layout is now a simple shell.
// The authentication check and conditional rendering will be handled
// by AdminLayoutWrapper, which is a client component.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>;
}
