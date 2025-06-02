"use client";

import { useState, useEffect } from 'react';
import type { CartItem } from '@/types';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/shared/page-container';
import { CartItemDisplay } from '@/components/cart/cart-item-display';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchCartItems, processCheckout } from '@/lib/supabasePlaceholders';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
// import { useRouter } from 'next/navigation'; // Uncomment if using router

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  // const router = useRouter(); // Uncomment if using router

  useEffect(() => {
    async function loadCartItems() {
      setIsLoading(true);
      // TODO: Fetch cart items from Supabase or local storage
      const items = await fetchCartItems();
      setCartItems(items);
      setIsLoading(false);
    }
    loadCartItems();
  }, []);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const totalValue = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast({ title: "Carrinho Vazio", description: "Adicione itens ao carrinho antes de finalizar.", variant: "destructive" });
      return;
    }
    // TODO: Implement Supabase checkout logic
    try {
      const order = await processCheckout(cartItems);
      toast({
        title: "Pedido Realizado!",
        description: `Seu pedido #${order.id} foi confirmado.`,
      });
      setCartItems([]); // Clear cart after successful checkout
      // router.push(`/order-confirmation/${order.id}`); // Redirect to an order confirmation page
    } catch (error) {
      toast({ title: "Erro no Checkout", description: "Não foi possível finalizar seu pedido. Tente novamente.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <h1 className="text-3xl font-headline mb-6">Seu Carrinho</h1>
          <p>Carregando itens...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="my-8">
        <h1 className="text-4xl font-headline text-center mb-10">Resumo do Pedido</h1>
        {cartItems.length === 0 ? (
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
                      key={item.id}
                      item={item}
                      onQuantityChange={handleQuantityChange}
                      onRemove={handleRemoveItem}
                    />
                  ))}
                </CardContent>
              </Card>
            </div>
            <div className="md:col-span-1">
              <Card className="shadow-lg sticky top-24"> {/* Sticky summary card */}
                <CardHeader>
                  <CardTitle className="font-headline text-2xl">Total do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-lg">
                    <span>Subtotal:</span>
                    <span>R$ {totalValue.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span>Frete:</span>
                    <span className="text-primary">Grátis</span> {/* Placeholder */}
                  </div>
                  <hr className="my-2 border-border" />
                  <div className="flex justify-between text-2xl font-bold text-primary">
                    <span>Total:</span>
                    <span>R$ {totalValue.toFixed(2).replace('.', ',')}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleCheckout} className="w-full text-lg py-6">
                    Finalizar Pedido
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
