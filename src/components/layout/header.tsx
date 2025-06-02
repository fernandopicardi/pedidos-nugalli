
"use client";

import Link from 'next/link';
import { ShoppingCart, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { subscribeToCartUpdates } from '@/lib/supabasePlaceholders';
import type { CartItem } from '@/types';

export function Header() {
  const [itemCount, setItemCount] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const handleCartUpdate = (cartItems: CartItem[]) => {
      const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      setItemCount(totalQuantity);
    };

    // Subscribe to cart updates and get an unsubscribe function
    const unsubscribe = subscribeToCartUpdates(handleCartUpdate);

    // Cleanup subscription on component unmount
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
          <nav className="flex items-center space-x-6">
            <Link href="/" className="text-foreground hover:text-primary transition-colors">
              Início
            </Link>
            {/* Add more navigation links if needed */}
            {/* <Link href="/about" className="text-foreground hover:text-primary transition-colors">
              Sobre Nós
            </Link> */}
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
