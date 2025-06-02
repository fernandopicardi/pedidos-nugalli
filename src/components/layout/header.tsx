
"use client";

import Link from 'next/link';
import { ShoppingCart, User, LayoutDashboard } from 'lucide-react'; // Added LayoutDashboard
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { subscribeToCartUpdates, getCurrentUser } from '@/lib/supabasePlaceholders'; // Added getCurrentUser
import type { CartItem, User as AppUser } from '@/types'; // Added AppUser type

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

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <header className="bg-background/80 backdrop-blur-sm shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="text-3xl font-headline text-primary hover:opacity-80 transition-opacity">
            Nugali
          </Link>
          <nav className="flex items-center space-x-4 md:space-x-6">
            <Link href="/" className="text-foreground hover:text-primary transition-colors text-sm md:text-base">
              Início
            </Link>
            {/* Add more navigation links if needed */}
            {/* <Link href="/about" className="text-foreground hover:text-primary transition-colors">
              Sobre Nós
            </Link> */}
            {currentUser && currentUser.role === 'admin' && (
              <Link href="/admin" legacyBehavior>
                <Button variant="ghost" size="sm" className="text-sm md:text-base">
                  <LayoutDashboard size={20} className="mr-1 md:mr-2" />
                  <span className="hidden md:inline">Admin Panel</span>
                  <span className="md:hidden">Admin</span>
                </Button>
              </Link>
            )}
            <Link href="/cart" className="relative flex items-center text-foreground hover:text-primary transition-colors">
              <ShoppingCart size={24} />
              {isClient && itemCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
              <span className="sr-only">Carrinho de Compras</span>
            </Link>
            <Link href="/auth" legacyBehavior>
              <Button variant="ghost" size="icon" aria-label="User Account">
                 <User size={24} />
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
