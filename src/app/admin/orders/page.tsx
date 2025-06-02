"use client";

import { useState, useEffect } from 'react';
import type { Order } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { PageContainer } from '@/components/shared/page-container';
import { fetchAdminOrders, updateOrderStatus } from '@/lib/supabasePlaceholders';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const statusMapping: Record<Order['status'], string> = {
  Pending: "Pendente",
  Processing: "Processando",
  Shipped: "Enviado",
  Delivered: "Entregue",
  Cancelled: "Cancelado"
};

const statusColors: Record<Order['status'], "default" | "secondary" | "destructive"> = {
  Pending: "secondary",
  Processing: "default",
  Shipped: "default",
  Delivered: "default", // Should be a success variant if available
  Cancelled: "destructive"
};


export default function OrderVisualizationPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  async function loadOrders() {
    setIsLoading(true);
    try {
      const data = await fetchAdminOrders();
      setOrders(data);
    } catch (error) {
      toast({ title: "Erro ao Carregar Pedidos", description: "Não foi possível carregar os pedidos.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast({ title: "Status Atualizado", description: `Status do pedido #${orderId} alterado para ${statusMapping[newStatus]}.` });
      await loadOrders(); // Refresh list
    } catch (error) {
      toast({ title: "Erro ao Atualizar", description: "Não foi possível atualizar o status do pedido.", variant: "destructive" });
    }
  };
  
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC'
  });

  return (
    <PageContainer className="py-8">
      <AdminPageHeader title="Visualização de Pedidos" />
      {isLoading ? (
        <p>Carregando pedidos...</p>
      ) : orders.length === 0 ? (
         <div className="text-center py-12 bg-card rounded-lg shadow">
            <p className="text-xl text-muted-foreground">Nenhum pedido encontrado.</p>
          </div>
      ) : (
        <div className="bg-card p-6 rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID do Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right w-[200px]">Alterar Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>{formatDate(order.orderDate)}</TableCell>
                  <TableCell>R$ {order.totalValue.toFixed(2).replace('.', ',')}</TableCell>
                  <TableCell>
                     <Badge variant={statusColors[order.status] || 'default'}>
                       {statusMapping[order.status] || order.status}
                     </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Select
                      value={order.status}
                      onValueChange={(newStatus: Order['status']) => handleStatusChange(order.id, newStatus)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Alterar status" />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(statusMapping) as Array<Order['status']>).map(statusKey => (
                           <SelectItem key={statusKey} value={statusKey}>
                             {statusMapping[statusKey]}
                           </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PageContainer>
  );
}
