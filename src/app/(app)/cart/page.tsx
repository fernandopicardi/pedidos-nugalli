
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { CartItem, User as AppUser } from '@/types';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/shared/page-container';
import { CartItemDisplay } from '@/components/cart/cart-item-display';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentUser, processCheckout } from '@/lib/supabasePlaceholders';
import { Loader2 } from 'lucide-react';

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true); // General loading for page/checkout
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function loadUserDataAndCart() {
      setIsLoading(true);
      const user = await getCurrentUser();
      setCurrentUser(user);

      if (!user) {
        setCartItems([]);
        setIsLoading(false);
        return;
      }

      try {
        const { data: items, error } = await supabase
          .from('Cart Items')
          .select(`
            cart_item_id, 
            quantity,
            cycle_product_id, 
            cycle_products (
              product_id,
              product_name_snapshot,
              price_in_cycle,
              display_image_url,
              Products ( description )
            )
          `)
          .eq('user_id', user.userId);

        if (error) {
          throw error;
        }

        if (items && Array.isArray(items)) {
          const mappedItems: CartItem[] = items.map((item) => ({
            cartItemId: item.cart_item_id,
            cycleProductId: item.cycle_product_id || '',
            productId: item.cycle_products?.product_id || '',
            name: item.cycle_products?.product_name_snapshot || 'Nome Indisponível',
            price: item.cycle_products?.price_in_cycle || 0,
            imageUrl: item.cycle_products?.display_image_url || 'https://placehold.co/600x400.png',
            quantity: item.quantity,
            description: item.cycle_products?.Products?.description || '',
          }));
          setCartItems(mappedItems);
        } else {
          setCartItems([]);
        }
      } catch (error: any) {
        toast({ title: "Erro ao Carregar Carrinho", description: error?.message || "Não foi possível buscar os itens do seu carrinho.", variant: "destructive" });
        setCartItems([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadUserDataAndCart();
  }, [toast]); // Removed setCurrentUser, setCartItems, setIsLoading as they are stable updaters

  const handleQuantityChange = async (cartItemId: string, newQuantity: number) => {
    const itemIndex = cartItems.findIndex(item => item.cartItemId === cartItemId);
    if (itemIndex === -1) return;

    const originalCartItems = [...cartItems]; // Keep a snapshot for revert
    const updatedCartItems = [...cartItems];
    updatedCartItems[itemIndex] = { ...updatedCartItems[itemIndex], quantity: newQuantity };
    setCartItems(updatedCartItems); // Optimistic UI update

    try {
      const { error } = await supabase
        .from('Cart Items')
        .update({ quantity: newQuantity })
        .eq('cart_item_id', cartItemId);

      if (error) {
        toast({ title: "Erro ao atualizar quantidade", description: error.message, variant: "destructive" });
        setCartItems(originalCartItems); // Revert local change if Supabase update fails
      }
    } catch (error: any) {
        toast({ title: "Erro ao atualizar quantidade", description: error?.message || "Erro desconhecido", variant: "destructive" });
        setCartItems(originalCartItems); // Revert on exception
    }
  };

  const handleRemoveItem = useCallback(async (cartItemId: string) => {
    const originalCartItems = [...cartItems];
    try {
      const { error: supabaseError } = await supabase
        .from('Cart Items')
        .delete()
        .eq('cart_item_id', cartItemId);

      if (supabaseError) {
        toast({ title: "Erro ao remover item", description: supabaseError.message, variant: "destructive" });
        // Do not update UI if Supabase reports an error
      } else {
        // Success from Supabase, update UI
        setCartItems(prevItems => prevItems.filter(item => item.cartItemId !== cartItemId));
      }
    } catch (error: any) {
      toast({ title: "Erro ao remover item", description: error?.message || "Não foi possível remover o item.", variant: "destructive" });
      setCartItems(originalCartItems); // Revert UI on exception
    }
  }, [cartItems, toast, setCartItems]); // Added setCartItems to dependency array

  const totalValue = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast({ title: "Carrinho Vazio", description: "Adicione itens ao carrinho antes de finalizar.", variant: "destructive" });
      return;
    }

    if (!currentUser) {
      toast({ title: "Login Necessário", description: "Você precisa estar logado para finalizar o pedido.", variant: "default" });
      sessionStorage.setItem('redirectAfterLogin', '/cart');
      router.push('/auth');
      return;
    }

    setIsLoading(true);
    try {
      const order = await processCheckout(cartItems);
      toast({
        title: "Pedido Realizado!",
        description: `Seu pedido #${order.orderNumber} foi confirmado.`,
      });
      setCartItems([]);
      // router.push(`/order-confirmation/${order.orderId}`); // TODO: Implement order confirmation page
    } catch (error: any) {
      toast({ title: "Erro no Checkout", description: error?.message || "Não foi possível finalizar seu pedido. Tente novamente.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !cartItems.length && !currentUser) { // Show full page loader only on initial load and if user data also not yet loaded
    return (
      <PageContainer className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando seu carrinho...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="my-8">
        <h1 className="text-4xl font-headline text-center mb-10">Resumo do Pedido</h1>
        {isLoading && cartItems.length === 0 && currentUser ? ( // Loading state for cart items specifically, if user is known
            <div className="flex flex-col items-center justify-center py-10">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                <p className="text-muted-foreground">Buscando itens do carrinho...</p>
            </div>
        ) : cartItems.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="p-10 text-center">
              <p className="text-xl text-muted-foreground mb-6">Seu carrinho está vazio.</p>
              <Button asChild>
                <Link href="/">Continuar Comprando</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="font-headline text-2xl">Itens no Carrinho</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {cartItems.map(item => (
                    <CartItemDisplay
                      key={item.cartItemId}
                      item={item}
                      onQuantityChange={handleQuantityChange}
                      onRemove={handleRemoveItem}
                    />
                  ))}
                </CardContent>
              </Card>
            </div>
            <div className="md:col-span-1">
              <Card className="shadow-lg sticky top-24">
                <CardHeader>
                  <CardTitle className="font-headline text-2xl">Total do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-lg">
                    <span>Subtotal:</span>
                    <span>R$ {totalValue.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <hr className="my-2 border-border" />
                  <div className="flex justify-between text-2xl font-bold text-primary">
                    <span>Total:</span>
                    <span>R$ {totalValue.toFixed(2).replace('.', ',')}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleCheckout} className="w-full text-lg py-6" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isLoading ? 'Processando...' : 'Finalizar Pedido'}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
