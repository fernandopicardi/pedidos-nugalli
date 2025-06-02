
"use client";

import { useState, useEffect } from 'react';
import type { User } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { PageContainer } from '@/components/shared/page-container';
import { fetchAdminUsers } from '@/lib/supabasePlaceholders';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CustomerManagementPage() {
  const [customers, setCustomers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  async function loadCustomers() {
    setIsLoading(true);
    try {
      const usersData = await fetchAdminUsers(); // Fetches only 'customer' role users
      usersData.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setCustomers(usersData);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
      toast({ title: "Erro ao Carregar Clientes", description: "Não foi possível carregar a lista de clientes.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

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
    ].filter(Boolean); // Remove empty or null parts
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
                <TableHead className="w-[100px]">Role</TableHead>
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
                    <Badge variant={customer.role === 'admin' ? 'default' : 'secondary'}>
                      {customer.role === 'admin' ? 'Admin' : 'Cliente'}
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
