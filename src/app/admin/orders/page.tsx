
"use client";

import { useState, useEffect, useCallback } from 'react'; // Added useCallback
import type { Order, Profile } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { PageContainer } from '@/components/shared/page-container';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Loader2, ListOrdered } from 'lucide-react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';

const orderStatusMapping: Record<Order['orderStatus'], string> = {
  "Pending Payment": "Pagamento Pendente",
  "Payment Confirmed": "Pagamento Confirmado",
  "Preparing": "Em Preparação",
  "Pronto para Retirada": "Pronto para Retirada",
  "Completed": "Concluído",
  "Cancelled": "Cancelado"
};

const paymentStatusMapping: Record<Order['paymentStatus'], string> = {
  "Unpaid": "Não Pago",
  "Paid": "Pago",
  "Refunded": "Reembolsado",
};


export default function OrderVisualizationPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadOrders = useCallback(async () => { // Wrapped in useCallback
    setIsLoading(true);
    try { 
      const { data, error: fetchError } = await supabase
        .from('orders') // Changed from 'Orders' to 'orders'
        .select('*, profiles ( display_name )') 
        .order('created_at', { ascending: false }); 

      if (fetchError) {
        throw fetchError;
      }

      setOrders(data.map(order => ({
        ...order, customerNameSnapshot: (order.profiles as Profile | null)?.display_name || 'N/A' })));
    } catch (error: any) { 
      toast({ title: "Erro ao Carregar Pedidos", description: error?.message || "Não foi possível carregar os pedidos.", variant: "destructive" });
      setOrders([]); // Ensure orders is an empty array on error
    } finally {
      setIsLoading(false);
    }
  }, [toast]); // Added toast to dependency array

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (orderId: string, newOrderStatus: Order['orderStatus'], newPaymentStatus?: Order['paymentStatus']) => {
    // Show loading state while updating - consider a more granular loading state if needed
    const originalOrders = [...orders];
    const orderIndex = orders.findIndex(o => o.orderId === orderId);
    if (orderIndex === -1) return;

    const updatedOrders = [...orders];
    updatedOrders[orderIndex] = {
      ...updatedOrders[orderIndex],
      orderStatus: newOrderStatus,
      paymentStatus: newPaymentStatus !== undefined ? newPaymentStatus : updatedOrders[orderIndex].paymentStatus
    };
    setOrders(updatedOrders); // Optimistic update

    try {
      const updateData: { order_status: Order['orderStatus']; payment_status?: Order['paymentStatus'] } = { order_status: newOrderStatus };
      if (newPaymentStatus !== undefined) {
        updateData.payment_status = newPaymentStatus;
      }
      const { error: updateError } = await supabase
        .from('orders') // Changed from 'Orders' to 'orders'
        .update(updateData)
        .eq('order_id', orderId);

      if (updateError) throw updateError;
      // No need to call loadOrders() again due to optimistic update, unless you want to re-verify
      // await loadOrders(); 
      toast({ title: "Status Atualizado", description: "O status do pedido foi alterado." });
    } catch (error: any) {
      setOrders(originalOrders); // Revert on error
      toast({ title: "Erro ao Atualizar", description: error?.message || "Não foi possível atualizar o status do pedido.", variant: "destructive" });
    }
  };
  
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC'
  });

  return (
    <PageContainer className="py-8">
      <AdminPageHeader title="Visualização de Pedidos" />
      {isLoading ? (
         <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
            <p className="text-muted-foreground">Carregando pedidos...</p>
        </div>
      ) : orders.length === 0 ? (
         <Card className="shadow-lg">
            <CardContent className="p-10 text-center flex flex-col items-center">
                <ListOrdered size={48} className="mx-auto text-muted-foreground mb-4" />
                <CardTitle className="text-xl font-semibold mb-2">Nenhum Pedido Encontrado</CardTitle>
                <p className="text-muted-foreground">Ainda não há pedidos registrados no sistema.</p>
            </CardContent>
        </Card>
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
