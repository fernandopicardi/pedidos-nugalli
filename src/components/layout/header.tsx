
"use client";

import Link from 'next/link';
import { ShoppingCart, User, LayoutDashboard, Settings } from 'lucide-react'; // Added LayoutDashboard, Settings
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { subscribeToCartUpdates, getCurrentUser } from '@/lib/supabasePlaceholders';
import type { CartItem, User as AppUser } from '@/types';

export function Header() {
  const [itemCount, setItemCount] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  useEffect(() => {
    setIsClient(true);

    const handleCartUpdate = (cartItems: CartItem[]) => {
      const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      setItemCount(totalQuantity);
    };

    async function loadUser() {
      const user = await getCurrentUser();
      setCurrentUser(user);
    }

    loadUser();
    const unsubscribe = subscribeToCartUpdates(handleCartUpdate);

    // Periodically check for user changes (e.g. if localStorage updates)
    const userCheckInterval = setInterval(loadUser, 2000);


    return () => {
      unsubscribe();
      clearInterval(userCheckInterval);
    };
  }, []);

  return (
    <header className="bg-background/80 backdrop-blur-sm shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="text-3xl font-headline text-primary hover:opacity-80 transition-opacity">
            Pedidos Nugalli
          </Link>
          <nav className="flex items-center space-x-2 md:space-x-4">
            <Link href="/" className="text-foreground hover:text-primary transition-colors text-sm md:text-base px-2 py-1 rounded-md">
              Início
            </Link>
            
            {currentUser && currentUser.role === 'admin' && (
              <Button asChild variant="ghost" size="sm" className="text-sm md:text-base">
                <Link href="/admin">
                  <LayoutDashboard size={20} className="mr-1 md:mr-2" />
                  <span className="hidden md:inline">Admin</span>
                  <span className="md:hidden">Admin</span>
                </Link>
              </Button>
            )}

            <Link href="/cart" className="relative flex items-center text-foreground hover:text-primary transition-colors p-2 rounded-md">
              <ShoppingCart size={24} />
              {isClient && itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
              <span className="sr-only">Carrinho de Compras</span>
            </Link>

            {currentUser ? (
              <Button asChild variant="ghost" size="icon" aria-label="Minha Conta">
                 <Link href="/account">
                   <Settings size={24} />
                </Link>
              </Button>
            ) : (
              <Button asChild variant="ghost" size="icon" aria-label="Login ou Cadastro">
                <Link href="/auth">
                   <User size={24} />
                </Link>
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

