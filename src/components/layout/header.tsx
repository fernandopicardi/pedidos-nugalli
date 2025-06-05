
"use client";

import Link from 'next/link';
import { ShoppingCart, User, LayoutDashboard, Settings } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { subscribeToCartUpdates, getCurrentUser } from '@/lib/supabasePlaceholders';
import type { CartItem, User as AppUser } from '@/types';
import { supabase } from '@/lib/supabaseClient'; // Import supabase client for onAuthStateChange

export function Header() {
  const [itemCount, setItemCount] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  useEffect(() => {
    setIsClient(true);

    // --- Cart Updates ---
    const handleCartUpdate = (cartItems: CartItem[]) => {
      const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      setItemCount(totalQuantity);
    };
    const unsubscribeCart = subscribeToCartUpdates(handleCartUpdate);

    // --- Auth State Changes ---
    async function loadUserFromSession() {
      const user = await getCurrentUser();
      setCurrentUser(user);
    }
    
    loadUserFromSession(); // Initial load

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
        if (session?.user) {
          const userProfile = await getCurrentUser(); // Re-fetch full profile
          setCurrentUser(userProfile);
        } else {
           // This case might occur if INITIAL_SESSION has no user or after a token refresh failure
          const userProfile = await getCurrentUser(); // Attempt to get user if session exists but event is unclear
          setCurrentUser(userProfile);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      }
    });

    return () => {
      unsubscribeCart();
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  return (
    <header className="bg-background/80 backdrop-blur-sm shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="text-3xl font-headline text-primary hover:opacity-80 transition-opacity">
            Pedidos Nugali
          </Link>
          <nav className="flex items-center space-x-2 md:space-x-4">
            <Link href="/" className="text-foreground hover:text-primary transition-colors text-sm md:text-base px-2 py-1 rounded-md">
              Início
            </Link>
            
            {currentUser && currentUser.role === true && (
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
