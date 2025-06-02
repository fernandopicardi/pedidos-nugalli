import { PageContainer } from '@/components/shared/page-container';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// This page can be a dashboard overview in the future.
// For now, it provides quick links or can redirect.

export default function AdminDashboardPage() {
  return (
    <PageContainer className="py-8">
      <AdminPageHeader title="Painel Administrativo" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-card rounded-lg shadow">
          <h2 className="text-xl font-headline mb-2">Gerenciar Temporadas</h2>
          <p className="text-muted-foreground mb-4">Crie e edite as temporadas de chocolates.</p>
          <Button asChild>
            <Link href="/admin/seasons">Ver Temporadas</Link>
          </Button>
        </div>
        <div className="p-6 bg-card rounded-lg shadow">
          <h2 className="text-xl font-headline mb-2">Gerenciar Produtos</h2>
          <p className="text-muted-foreground mb-4">Adicione e atualize os produtos do catálogo.</p>
          <Button asChild>
            <Link href="/admin/products">Ver Produtos</Link>
          </Button>
        </div>
        <div className="p-6 bg-card rounded-lg shadow">
          <h2 className="text-xl font-headline mb-2">Visualizar Pedidos</h2>
          <p className="text-muted-foreground mb-4">Acompanhe os pedidos recebidos.</p>
          <Button asChild>
            <Link href="/admin/orders">Ver Pedidos</Link>
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
