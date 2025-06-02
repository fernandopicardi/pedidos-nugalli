"use client";

import Link from 'next/link';
import { ShoppingCart, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

// Placeholder for fetching cart item count
async function fetchCartItemCount(): Promise<number> {
  // TODO: Implement logic to get cart item count (e.g., from context or Supabase)
  return 3; // Stubbed data
}

export function Header() {
  const [itemCount, setItemCount] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    fetchCartItemCount().then(count => setItemCount(count));
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
