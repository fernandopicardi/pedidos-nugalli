
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Home, CalendarClock, Package, ShoppingBag, LogOut, Users, AlertCircle, Loader2, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { signOut, checkAdminRole } from '@/lib/supabasePlaceholders';
import { PageContainer } from '@/components/shared/page-container';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/purchase-cycles', label: 'Ciclos de Compra', icon: CalendarClock },
  { href: '/admin/products', label: 'Produtos (Master)', icon: Package },
  { href: '/admin/orders', label: 'Pedidos', icon: ShoppingBag },
  { href: '/admin/customers', label: 'Clientes', icon: Users },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth'); 
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
         <Link href="/admin" className="flex items-center gap-2">
          <Home className="text-sidebar-primary" />
          <h1 className="text-2xl font-headline font-bold text-sidebar-primary group-data-[collapsible=icon]:hidden">
            Panel Admin
          </h1>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {adminNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href)}
                tooltip={{ children: item.label, side: "right", align:"center" }}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border flex flex-col gap-2">
        <Button variant="ghost" asChild className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center">
          <Link href="/">
            <ArrowLeft size={18} />
            <span className="group-data-[collapsible=icon]:hidden">Voltar</span>
          </Link>
        </Button>
        <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center">
          <LogOut size={18} />
          <span className="group-data-[collapsible=icon]:hidden">Sair</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

export function AdminLayoutWrapper({ children }: { children: ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function verifyAdminStatus() {
      const isAdmin = await checkAdminRole();
      setIsAuthorized(isAdmin);
      setIsLoading(false);
    }
    verifyAdminStatus();
  }, []);

  if (isLoading) {
    return (
      <PageContainer className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)]"> {/* Adjusted for header */}
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Verificando permissões...</p>
      </PageContainer>
    );
  }

  if (!isAuthorized) {
    return (
      <PageContainer className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] text-center"> {/* Adjusted for header */}
        <AlertCircle className="h-16 w-16 text-destructive mb-6" />
        <h1 className="text-3xl font-headline text-destructive mb-3">Acesso Negado</h1>
        <p className="text-lg text-muted-foreground mb-8">Você não tem permissão para visualizar esta página.</p>
        <Button onClick={() => router.push('/')} size="lg">
          Voltar para Início
        </Button>
      </PageContainer>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      {/* The main flex container should allow content to flow after the sticky Header */}
      {/* The Sidebar component itself is now adjusted to sit below the header */}
      <div className="flex flex-1"> {/* flex-1 allows this to take available space in <main> */}
        <AdminSidebar />
        <SidebarInset className="flex-1 overflow-y-auto">
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
