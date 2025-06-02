import type { ReactNode } from 'react';
import { AdminLayoutWrapper } from '@/components/layout/admin-sidebar';
import { checkAdminRole } from '@/lib/supabasePlaceholders';
// import { redirect } from 'next/navigation'; // Uncomment if using redirect

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const isAdmin = await checkAdminRole();

  if (!isAdmin) {
    // redirect('/auth'); // Redirect non-admins to login page
    // For now, show an access denied message if not redirecting
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-2xl text-destructive">Acesso Negado. Você não tem permissão para ver esta página.</p>
      </div>
    );
  }

  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>;
}
