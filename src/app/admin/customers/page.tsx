
"use client";

import { useState, useEffect } from 'react';
import type { User, Order } from '@/types'; // Added Order type
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button'; // Added Button
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'; // Added Dialog components
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { PageContainer } from '@/components/shared/page-container';
import { supabase } from '@/lib/supabaseClient';
import { fetchUserOrders } from '@/lib/supabasePlaceholders'; // Added fetchUserOrders
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, Eye, ListOrdered, PackageOpen, ShoppingBag, CalendarDays } from 'lucide-react'; // Added Eye, ListOrdered, PackageOpen
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardTitle as EmptyCardTitle } from '@/components/ui/card'; // Renamed CardTitle to avoid conflict
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

// Status mappings and variant getters (similar to account/page and admin/orders/page)
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

const getOrderStatusVariant = (status: Order['orderStatus']): "default" | "secondary" | "destructive" => {
  switch (status) {
    case 'Completed': return 'default';
    case 'Preparing':
    case 'Pronto para Retirada':
    case 'Payment Confirmed':
      return 'secondary';
    case 'Pending Payment': return 'secondary';
    case 'Cancelled': return 'destructive';
    default: return 'secondary';
  }
};

const getPaymentStatusVariant = (status: Order['paymentStatus']): "default" | "secondary" | "destructive" => {
  switch (status) {
    case 'Paid': return 'default';
    case 'Unpaid': return 'secondary';
    case 'Refunded': return 'destructive';
    default: return 'secondary';
  }
};


export default function CustomerManagementPage() {
  const [customers, setCustomers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [isLoadingCustomerOrders, setIsLoadingCustomerOrders] = useState(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*') 
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      
      if (!data || !Array.isArray(data)) {
        setCustomers([]);
        setIsLoading(false);
        return;
      }

      const usersData: User[] = data.map(item => ({
        userId: item.id,
        email: item.email,
        displayName: item.display_name || 'N/A',
        whatsapp: item.whatsapp || 'N/A', 
        isAdmin: item.is_admin,
        createdAt: item.created_at,
        addressStreet: item.address_street || undefined,
        addressNumber: item.address_number || undefined,
        addressComplement: item.address_complement || undefined,
        addressNeighborhood: item.address_neighborhood || undefined,
        addressCity: item.address_city || undefined,
        addressState: item.address_state || undefined,
        addressZip: item.address_zip || undefined,
      }));

      setCustomers(usersData);
    } catch (error: any) {
      console.error("Failed to fetch customers:", error);
      toast({ title: "Erro ao Carregar Clientes", description: String(error?.message || "Não foi possível carregar a lista de clientes."), variant: "destructive" });
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (dateString: string, includeTime = false) => {
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' // Specify UTC
    };
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  const formatAddress = (user: User) => {
    const parts = [
      user.addressStreet,
      user.addressNumber,
      user.addressComplement,
      user.addressNeighborhood,
      user.addressCity,
      user.addressState,
      user.addressZip,
    ].filter(Boolean);
    return parts.join(', ') || 'N/A';
  };

  const handleViewOrdersClick = async (customer: User) => {
    setSelectedCustomer(customer);
    setIsOrdersModalOpen(true);
    setIsLoadingCustomerOrders(true);
    setCustomerOrders([]); 
    try {
      const orders = await fetchUserOrders(customer.userId);
      orders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
      setCustomerOrders(orders);
    } catch (error: any) {
      toast({
        title: `Erro ao Carregar Pedidos de ${customer.displayName}`,
        description: error.message || "Não foi possível buscar os pedidos do cliente.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCustomerOrders(false);
    }
  };

  return (
    <PageContainer className="py-8">
      <AdminPageHeader title="Visualização de Clientes" />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
          <p className="text-muted-foreground">Carregando clientes...</p>
        </div>
      ) : customers.length === 0 ? (
        <Card className="shadow-lg">
          <CardContent className="p-10 text-center flex flex-col items-center">
            <Users size={48} className="mx-auto text-muted-foreground mb-4" />
            <EmptyCardTitle className="text-xl font-semibold mb-2">Nenhum Cliente Encontrado</EmptyCardTitle>
            <p className="text-muted-foreground">Ainda não há clientes cadastrados no sistema.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-card p-4 md:p-6 rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead className="w-[160px]">Cadastrado em</TableHead>
                <TableHead className="w-[100px]">Tipo</TableHead>
                <TableHead className="w-[150px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.userId}>
                  <TableCell className="font-medium">{customer.displayName}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.whatsapp}</TableCell>
                  <TableCell className="text-xs max-w-xs truncate" title={formatAddress(customer)}>{formatAddress(customer)}</TableCell>
                  <TableCell>{formatDate(customer.createdAt, true)}</TableCell>
                  <TableCell>
                    <Badge variant={customer.isAdmin ? 'default' : 'secondary'}>
                      {customer.isAdmin ? 'Admin' : 'Cliente'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleViewOrdersClick(customer)}>
                      <Eye size={16} className="mr-1 md:mr-2" />
                      <span className="hidden md:inline">Ver Pedidos</span>
                       <span className="md:hidden">Pedidos</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {selectedCustomer && (
        <Dialog open={isOrdersModalOpen} onOpenChange={setIsOrdersModalOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl">Pedidos de {selectedCustomer.displayName}</DialogTitle>
              <DialogDescription>
                Histórico de pedidos para o cliente {selectedCustomer.email}.
              </DialogDescription>
            </DialogHeader>
            <Separator />
            <ScrollArea className="flex-grow pr-4 -mr-4"> {/* Added pr-4 and -mr-4 for scrollbar spacing */}
              {isLoadingCustomerOrders ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                  <p className="text-muted-foreground">Carregando pedidos do cliente...</p>
                </div>
              ) : customerOrders.length === 0 ? (
                <div className="py-10 text-center">
                  <PackageOpen size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg text-muted-foreground">Este cliente ainda não fez nenhum pedido.</p>
                </div>
              ) : (
                <div className="space-y-4 py-2">
                  {customerOrders.map(order => (
                     <Card key={order.orderId} className="shadow-md">
                        <CardHeader className="pb-3 pt-4 px-4">
                           <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                            <EmptyCardTitle className="font-headline text-lg">Pedido #{order.orderNumber}</EmptyCardTitle>
                            <div className="text-xs text-muted-foreground flex items-center">
                                <CalendarDays size={14} className="mr-1" />
                                {formatDate(order.orderDate, true)}
                            </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-semibold">Total:</span>
                                <span className="font-bold text-primary">R$ {order.orderTotalAmount.toFixed(2).replace('.', ',')}</span>
                            </div>
                             <div className="flex justify-between items-center text-sm">
                                <span className="font-semibold">Status do Pedido:</span>
                                <Badge variant={getOrderStatusVariant(order.orderStatus)} className="text-xs">
                                    {orderStatusMapping[order.orderStatus] || order.orderStatus}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-semibold">Status do Pagamento:</span>
                                <Badge variant={getPaymentStatusVariant(order.paymentStatus)} className="text-xs">
                                {paymentStatusMapping[order.paymentStatus] || order.paymentStatus}
                                </Badge>
                            </div>
                            {order.items && order.items.length > 0 && (
                                <>
                                    <Separator className="my-2"/>
                                    <p className="text-xs font-medium pt-1">Itens do Pedido:</p>
                                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5 pl-1">
                                        {order.items.map((item, index) =>(
                                            <li key={`${order.orderId}-item-${index}`}>
                                                {item.quantity}x {item.productName} - R$ {item.priceAtPurchase.toFixed(2).replace('.',',')} (cada)
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </CardContent>
                     </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
            <DialogFooter className="pt-4 mt-auto">
              <Button variant="outline" onClick={() => setIsOrdersModalOpen(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </PageContainer>
  );
}

