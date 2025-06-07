
"use client";

import { useState, useEffect } from 'react';
import { PageContainer } from '@/components/shared/page-container';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { fetchActiveCycleMetrics } from '@/lib/supabasePlaceholders';
import type { PurchaseCycle } from '@/types';
import { CalendarClock, Package, ShoppingBag, Users, AlertCircle, TrendingUp, Clock } from 'lucide-react'; // Added icons

interface AdminDashboardMetrics {
  activeCycle: PurchaseCycle | null;
  pendingOrdersCount: number;
  totalSalesActiveCycle: number;
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      setIsLoading(true);
      try {
        const data = await fetchActiveCycleMetrics();
        setMetrics(data);
      } catch (error) {
        console.error("Failed to load admin dashboard metrics:", error);
        setMetrics({ activeCycle: null, pendingOrdersCount: 0, totalSalesActiveCycle: 0 }); // Set to default on error
      } finally {
        setIsLoading(false);
      }
    }
    loadMetrics();
  }, []);

  const StatCard = ({ title, value, icon, description, isLoadingCard }: { title: string; value: string | number; icon: React.ReactNode; description?: string, isLoadingCard?: boolean }) => (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoadingCard ? (
          <div className="h-8 w-24 bg-muted rounded animate-pulse"></div>
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {description && !isLoadingCard && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );

  return (
    <PageContainer className="py-8">
      <AdminPageHeader title="Painel Administrativo" />

      <section className="mb-8">
        <h2 className="text-2xl font-headline mb-4">Visão Geral do Ciclo Ativo</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Ciclo Ativo" value="" icon={<CalendarClock className="h-4 w-4 text-muted-foreground" />} isLoadingCard={true} />
            <StatCard title="Pedidos Pendentes/Preparo" value="" icon={<Clock className="h-4 w-4 text-muted-foreground" />} isLoadingCard={true} />
            <StatCard title="Vendas (Pagos)" value="" icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} isLoadingCard={true} />
          </div>
        ) : metrics && metrics.activeCycle ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard 
              title="Ciclo Ativo" 
              value={metrics.activeCycle.name} 
              icon={<CalendarClock className="h-4 w-4 text-primary" />} 
              description={`Termina em: ${new Date(metrics.activeCycle.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
            />
            <StatCard 
              title="Pedidos Pendentes/Preparo" 
              value={metrics.pendingOrdersCount} 
              icon={<Clock className="h-4 w-4 text-primary" />} 
              description="Pagamento pendente ou em preparação"
            />
            <StatCard 
              title="Vendas (Pagos)" 
              value={`R$ ${metrics.totalSalesActiveCycle.toFixed(2).replace('.', ',')}`}
              icon={<TrendingUp className="h-4 w-4 text-primary" />}
              description="Total de pedidos com pagamento confirmado"
            />
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 flex items-center">
              <AlertCircle className="h-6 w-6 text-destructive mr-3"/>
              <p className="text-destructive">Nenhum ciclo de compra ativo encontrado ou erro ao carregar dados.</p>
            </CardContent>
          </Card>
        )}
      </section>
      
      <section>
        <h2 className="text-2xl font-headline mb-6">Gerenciamento</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/admin/purchase-cycles" className="block hover:shadow-lg transition-shadow rounded-lg">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-headline">
                  <CalendarClock size={22} className="mr-3 text-primary"/> Gerenciar Ciclos de Compra
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Crie e edite os ciclos de compra (temporadas) de chocolates.</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/products" className="block hover:shadow-lg transition-shadow rounded-lg">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-headline">
                  <Package size={22} className="mr-3 text-primary"/> Gerenciar Produtos (Master)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Adicione e atualize os produtos do catálogo mestre.</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/orders" className="block hover:shadow-lg transition-shadow rounded-lg">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-headline">
                  <ShoppingBag size={22} className="mr-3 text-primary"/> Visualizar Pedidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Acompanhe os pedidos recebidos e atualize seus status.</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/customers" className="block hover:shadow-lg transition-shadow rounded-lg">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-headline">
                  <Users size={22} className="mr-3 text-primary"/> Visualizar Clientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">Consulte a lista de clientes cadastrados e seus dados.</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>
    </PageContainer>
  );
}
