
"use client";

import { useState, useEffect } from 'react';
import type { User } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { PageContainer } from '@/components/shared/page-container';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CustomerManagementPage() {
  const [customers, setCustomers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, display_name, whatsapp, is_admin, created_at, address_street, address_number, address_complement, address_neighborhood, address_city, address_state, address_zip') // Select is_admin
        .eq('is_admin', false); // Filter for customers (is_admin = false)

      if (error) {
        throw error;
      }

      const usersData: User[] = data.map(item => ({
        userId: item.id, 
        email: item.email,
        displayName: item.display_name || 'N/A',
        whatsapp: item.whatsapp,
        isAdmin: item.is_admin, // Map is_admin
        createdAt: item.created_at,
        ...item 
      })) as User[]; 

      usersData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setCustomers(usersData);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      toast({ title: "Erro ao Carregar Clientes", description: "Não foi possível carregar a lista de clientes.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    } 
  };

  useEffect(() => { 
    loadCustomers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Removed loadCustomers from dependency array as it's stable

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC'
  });

  const formatAddress = (user: User) => {
    const parts = [
      user.addressStreet,
      user.addressNumber,
      user.addressComplement,
      user.addressNeighborhood,
      user.addressCity,
      user.addressState,
      user.addressZip,
    ].filter(Boolean); 
    return parts.join(', ') || 'N/A';
  };

  return (
    <PageContainer className="py-8">
      <AdminPageHeader title="Visualização de Clientes" />

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
          <p>Carregando clientes...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg shadow">
          <UserCircle size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground">Nenhum cliente cadastrado.</p>
        </div>
      ) : (
        <div className="bg-card p-4 md:p-6 rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead className="w-[160px]">Cadastrado em</TableHead>
                <TableHead className="w-[100px]">Tipo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.userId}>
                  <TableCell className="font-medium">{customer.displayName}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.whatsapp || 'N/A'}</TableCell>
                  <TableCell className="text-xs max-w-xs truncate">{formatAddress(customer)}</TableCell>
                  <TableCell>{formatDate(customer.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant={customer.isAdmin ? 'default' : 'secondary'}>
                      {customer.isAdmin ? 'Admin' : 'Cliente'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PageContainer>
  );
}
