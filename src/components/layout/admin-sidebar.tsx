"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarFooter
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Home, CalendarClock, Package, ShoppingBag, LogOut, Settings } from 'lucide-react';
import { signOut } from '@/lib/supabasePlaceholders';
// import { useRouter } from 'next/navigation'; // Uncomment if using router

const adminNavItems = [
  { href: '/admin/seasons', label: 'Temporadas', icon: CalendarClock },
  { href: '/admin/products', label: 'Produtos', icon: Package },
  { href: '/admin/orders', label: 'Pedidos', icon: ShoppingBag },
  // Add more admin links if needed
  // { href: '/admin/settings', label: 'Configurações', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  // const router = useRouter(); // Uncomment if using router

  const handleSignOut = async () => {
    await signOut();
    // router.push('/auth'); // Redirect to login after sign out
    console.log("User signed out");
  };

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border">
        <SidebarHeader className="p-4 border-b border-sidebar-border">
           <Link href="/admin" className="flex items-center gap-2">
            <Home className="text-sidebar-primary" /> {/* Using Home as a generic logo icon */}
            <h1 className="text-2xl font-headline font-bold text-sidebar-primary group-data-[collapsible=icon]:hidden">
              Nugali Admin
            </h1>
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {adminNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.href)}
                    tooltip={{ children: item.label, side: "right", align:"center" }}
                  >
                    <a>
                      <item.icon />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-sidebar-border">
          <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center">
            <LogOut size={18} />
            <span className="group-data-[collapsible=icon]:hidden">Sair</span>
          </Button>
        </SidebarFooter>
      </Sidebar>
      {/* The SidebarInset is where the main content of the admin page will go */}
      {/* This will be handled by the AdminLayout component */}
    </SidebarProvider>
  );
}

// This is a wrapper for the admin layout to correctly use SidebarInset
export function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen> {/* Provider needed for SidebarInset */}
      <div className="flex h-screen bg-background">
        <AdminSidebar />
        <SidebarInset className="flex-1 overflow-y-auto">
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
