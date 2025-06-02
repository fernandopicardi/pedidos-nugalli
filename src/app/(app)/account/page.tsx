
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { PageContainer } from '@/components/shared/page-container';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser, updateUserDetails, signOut, fetchUserOrders } from '@/lib/supabasePlaceholders';
import type { User as AppUser, Order } from '@/types';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut, ShoppingBag, CalendarDays, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

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
    case 'Completed': return 'default'; // Typically success/primary color
    case 'Preparing':
    case 'Pronto para Retirada':
    case 'Payment Confirmed':
      return 'secondary'; // Neutral or in-progress
    case 'Pending Payment': return 'secondary'; // Muted/secondary
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


export default function AccountPage() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);

  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function loadUserData() {
      setIsLoadingUser(true);
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setDisplayName(currentUser.displayName);
        setWhatsapp(currentUser.whatsapp || '');
        
        setIsLoadingOrders(true);
        try {
          const userOrders = await fetchUserOrders(currentUser.userId);
          userOrders.sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
          setOrders(userOrders);
        } catch (error) {
          toast({ title: "Erro ao Carregar Pedidos", description: "Não foi possível buscar seus pedidos.", variant: "destructive" });
        } finally {
          setIsLoadingOrders(false);
        }

      } else {
        router.push('/auth');
      }
      setIsLoadingUser(false);
    }
    loadUserData();
  }, [router, toast]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;

    setIsSubmitting(true);

    const { error, user: updatedUser } = await updateUserDetails(user.userId, { 
      displayName, 
      whatsapp,
    });
    setIsSubmitting(false);

    if (error) {
      toast({ title: "Erro ao Atualizar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Dados Atualizados", description: "Suas informações foram salvas com sucesso." });
      if (updatedUser) setUser(updatedUser); 
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Logout Efetuado", description: "Você foi desconectado." });
    setUser(null); 
    router.push('/'); 
  };

  const formatDate = (dateString: string, includeTime = false) => {
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC'
    };
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  };

  if (isLoadingUser) {
    return (
      <PageContainer className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando dados da conta...</p>
      </PageContainer>
    );
  }

  if (!user) {
    // This case should ideally be handled by the redirect in useEffect,
    // but it's good practice to keep a fallback.
    return (
      <PageContainer className="text-center py-12">
        <p>Você precisa estar logado para acessar esta página.</p>
        <Button onClick={() => router.push('/auth')} className="mt-4">Ir para Login</Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="max-w-3xl mx-auto my-8 md:my-12">
      <Card className="shadow-xl mb-12">
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-center">Minhas Informações</CardTitle>
          <CardDescription className="text-center">Gerencie seus dados pessoais e de contato.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  readOnly
                  className="bg-muted cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="memberSince">Membro desde</Label>
                <Input
                  id="memberSince"
                  type="text"
                  value={formatDate(user.createdAt)}
                  readOnly
                  className="bg-muted cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Tipo de Conta</Label>
              <Input
                id="role"
                type="text"
                value={user.role === 'admin' ? 'Administrador' : 'Cliente'}
                readOnly
                className="bg-muted cursor-not-allowed"
              />
            </div>
            
            <Separator />

            <div className="space-y-2">
              <Label htmlFor="displayName">Nome de Exibição</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Seu nome completo"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                type="tel"
                placeholder="Ex: 5511999998888"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                required
              />
               <p className="text-xs text-muted-foreground">Inclua o código do país (ex: 55 para Brasil). Obrigatório.</p>
            </div>

          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
            <Button type="button" variant="outline" onClick={handleSignOut} className="w-full sm:w-auto">
              <LogOut size={18} className="mr-2" /> Sair (Logout)
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Separator className="my-10" />

      <section>
        <h2 className="text-3xl font-headline text-center mb-8">Meus Pedidos</h2>
        {isLoadingOrders ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
            <p className="text-muted-foreground">Buscando seus pedidos...</p>
          </div>
        ) : orders.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="p-10 text-center">
              <ShoppingBag size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-xl text-muted-foreground">Você ainda não fez nenhum pedido.</p>
              <Button asChild className="mt-6">
                <a href="/">Ver Produtos</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <Card key={order.orderId} className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <CardTitle className="font-headline text-xl">Pedido #{order.orderNumber}</CardTitle>
                    <div className="text-sm text-muted-foreground flex items-center">
                      <CalendarDays size={16} className="mr-2" />
                      {formatDate(order.orderDate, true)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total do Pedido:</span>
                    <span className="text-lg font-bold text-primary">R$ {order.orderTotalAmount.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Status do Pedido:</span>
                    <Badge variant={getOrderStatusVariant(order.orderStatus)}>
                      {orderStatusMapping[order.orderStatus] || order.orderStatus}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Status do Pagamento:</span>
                     <Badge variant={getPaymentStatusVariant(order.paymentStatus)}>
                       {paymentStatusMapping[order.paymentStatus] || order.paymentStatus}
                    </Badge>
                  </div>
                   <Separator className="my-3"/>
                   <p className="text-sm font-medium">Itens do Pedido:</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-1">
                        {order.items.map((item, index) =>(
                            <li key={`${order.orderId}-item-${index}`}>
                                {item.quantity}x {item.productName} - R$ {item.priceAtPurchase.toFixed(2).replace('.',',')} (cada)
                            </li>
                        ))}
                    </ul>
                </CardContent>
                {/* 
                <CardFooter>
                  <Button variant="outline" size="sm" disabled>Ver Detalhes</Button> 
                </CardFooter>
                */}
              </Card>
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
}
