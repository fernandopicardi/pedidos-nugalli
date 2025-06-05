
"use client";

import { useState, useEffect } from 'react';
import type { Order, Profile } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { PageContainer } from '@/components/shared/page-container';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from 'lucide-react';

const orderStatusMapping: Record<Order['orderStatus'], string> = {
  "Pending Payment": "Pagamento Pendente",
  "Payment Confirmed": "Pagamento Confirmado",
  "Preparing": "Em Preparação",
  "Pronto para Retirada": "Pronto para Retirada",
  "Completed": "Concluído",
  "Cancelled": "Cancelado"
};

// Removed orderStatusColors as badges are no longer directly used for display in this manner.
// Select component itself will display the status.

const paymentStatusMapping: Record<Order['paymentStatus'], string> = {
  "Unpaid": "Não Pago",
  "Paid": "Pago",
  "Refunded": "Reembolsado",
};

// Removed paymentStatusColors for the same reason.


export default function OrderVisualizationPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  async function loadOrders() {
    setIsLoading(true);
    try { // Removed unused 'error' variable from the catch block
      const { data, error: fetchError } = await supabase
        .from('Orders')
        .select('*, profiles ( display_name )') // Select all from orders, join with profiles to get display_name
        .order('created_at', { ascending: false }); // Order by creation date descending

      if (fetchError) {
        throw fetchError;
      }

      // Map the data to the Order type, including the customer name from the join
      setOrders(data.map(order => ({
        ...order, customerNameSnapshot: (order.profiles as Profile | null)?.display_name || 'N/A' })));
    } catch (error: any) { // Removed unused 'error' variable from the catch block
      toast({ title: "Erro ao Carregar Pedidos", description: "Não foi possível carregar os pedidos.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [loadOrders]); // Added loadOrders to the dependency array

  const handleStatusChange = async (orderId: string, newOrderStatus: Order['orderStatus'], newPaymentStatus?: Order['paymentStatus']) => {
    setIsLoading(true); // Show loading state while updating
    try {
      const updateData: { order_status: Order['orderStatus']; payment_status?: Order['paymentStatus'] } = { order_status: newOrderStatus };
      if (newPaymentStatus !== undefined) {
        updateData.payment_status = newPaymentStatus;
      }
      const { error: updateError } = await supabase
        .from('Orders')
        .update(updateData)
        .eq('order_id', orderId);

      if (updateError) throw updateError;
      await loadOrders(); 
    } catch (error) {
      toast({ title: "Erro ao Atualizar", description: "Não foi possível atualizar o status do pedido.", variant: "destructive" }); // Removed unused 'error' variable from the catch block
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
        <TooltipProvider>
          <div className="bg-card p-4 md:p-6 rounded-lg shadow">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="w-[160px]">Data</TableHead>
                  <TableHead className="w-[120px]">Valor Total</TableHead>
                  <TableHead className="w-[200px]">
                    <div className="flex items-center">
                      Status do Pedido
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Indica a fase atual do pedido no fluxo de trabalho (ex: Em Preparação, Pronto para Retirada).</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableHead>
                  <TableHead className="w-[180px]">
                     <div className="flex items-center">
                      Status do Pagamento
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Indica a situação financeira do pedido (ex: Pago, Não Pago, Reembolsado).</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.orderId}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{order.customerNameSnapshot}</TableCell>
                    <TableCell>{formatDate(order.orderDate)}</TableCell>
                    <TableCell>R$ {order.orderTotalAmount.toFixed(2).replace('.', ',')}</TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Select
                            value={order.orderStatus}
                            onValueChange={(newStatus: Order['orderStatus']) => handleStatusChange(order.orderId, newStatus, order.paymentStatus)}
                          >
                            <SelectTrigger className="w-full h-9 text-xs">
                              <SelectValue>
                                {orderStatusMapping[order.orderStatus] || order.orderStatus}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(orderStatusMapping) as Array<Order['orderStatus']>).map(statusKey => (
                                 <SelectItem key={statusKey} value={statusKey} className="text-xs">
                                   {orderStatusMapping[statusKey]}
                                 </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Altere o status do fluxo de trabalho deste pedido.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <Select
                            value={order.paymentStatus}
                            onValueChange={(newStatus: Order['paymentStatus']) => handleStatusChange(order.orderId, order.orderStatus, newStatus)}
                          >
                            <SelectTrigger className="w-full h-9 text-xs">
                              <SelectValue>
                                {paymentStatusMapping[order.paymentStatus] || order.paymentStatus}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(paymentStatusMapping) as Array<Order['paymentStatus']>).map(statusKey => (
                                 <SelectItem key={statusKey} value={statusKey} className="text-xs">
                                   {paymentStatusMapping[statusKey]}
                                 </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Altere o status financeiro deste pedido.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TooltipProvider>
      )}
    </PageContainer>
  );
}
