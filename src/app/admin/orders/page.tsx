
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
import { Separator } from '@/components/ui/separator';
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

const orderStatusColors: Record<Order['orderStatus'], "default" | "secondary" | "destructive" | "outline"> = {
  "Pending Payment": "secondary",
  "Payment Confirmed": "default",
  "Preparing": "outline", 
  "Pronto para Retirada": "outline",
  "Completed": "default", 
  "Cancelled": "destructive"
};

const paymentStatusMapping: Record<Order['paymentStatus'], string> = {
  "Unpaid": "Não Pago",
  "Paid": "Pago",
  "Refunded": "Reembolsado",
};

const paymentStatusColors: Record<Order['paymentStatus'], "default" | "secondary" | "destructive"> = {
  "Unpaid": "secondary",
  "Paid": "default",
  "Refunded": "destructive",
};


export default function OrderVisualizationPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  async function loadOrders() {
    setIsLoading(true);
    try {
      const data = await fetchAdminOrders();
      data.sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
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

  const handleStatusChange = async (orderId: string, newOrderStatus: Order['orderStatus'], newPaymentStatus?: Order['paymentStatus']) => {
    try {
      await updateOrderStatus(orderId, newOrderStatus, newPaymentStatus);
      toast({ title: "Status Atualizado", description: `Status do pedido #${orderId.slice(-5)} atualizado.` });
      await loadOrders(); 
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
        <TooltipProvider>
          <div className="bg-card p-4 md:p-6 rounded-lg shadow">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="w-[160px]">Data</TableHead>
                  <TableHead className="w-[120px]">Valor Total</TableHead>
                  <TableHead className="w-[180px]">
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
                  <TableHead className="w-[150px]">
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
                  <TableHead className="text-right w-[280px]">Alterar Status</TableHead>
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
                       <Badge variant={orderStatusColors[order.orderStatus] || 'default'} className="whitespace-nowrap">
                         {orderStatusMapping[order.orderStatus] || order.orderStatus}
                       </Badge>
                    </TableCell>
                    <TableCell>
                       <Badge variant={paymentStatusColors[order.paymentStatus] || 'default'} className="whitespace-nowrap">
                         {paymentStatusMapping[order.paymentStatus] || order.paymentStatus}
                       </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col sm:flex-row gap-2 justify-end">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Select
                              value={order.orderStatus}
                              onValueChange={(newStatus: Order['orderStatus']) => handleStatusChange(order.orderId, newStatus, order.paymentStatus)}
                            >
                              <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs">
                                <SelectValue placeholder="Pedido..." />
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
                        <Tooltip>
                          <TooltipTrigger asChild>
                             <Select
                              value={order.paymentStatus}
                              onValueChange={(newStatus: Order['paymentStatus']) => handleStatusChange(order.orderId, order.orderStatus, newStatus)}
                            >
                              <SelectTrigger className="w-full sm:w-[150px] h-9 text-xs">
                                <SelectValue placeholder="Pagamento..." />
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
                      </div>
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
