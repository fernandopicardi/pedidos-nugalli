
"use client";

import { useState, useEffect } from 'react';
import type { User } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { PageContainer } from '@/components/shared/page-container';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardTitle } from '@/components/ui/card';

export default function CustomerManagementPage() {
  const [customers, setCustomers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*') // Changed to select('*') as per user's instruction
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (!data || !Array.isArray(data)) {
        setCustomers([]);
        return;
      }

      const usersData: User[] = data.map(item => ({
        userId: item.id, 
        email: item.email,
        displayName: item.display_name || 'N/A',
        whatsapp: item.whatsapp || 'N/A', // Assuming whatsapp is NOT NULL from previous context
        isAdmin: item.is_admin,
        createdAt: item.created_at,
        addressStreet: item.address_street || undefined,
        addressNumber: item.address_number || undefined,
        addressComplement: item.address_complement || undefined,
        addressNeighborhood: item.address_neighborhood || undefined,
        addressCity: item.address_city || undefined,
        addressState: item.address_state || undefined,
        addressZip: item.address_zip || undefined,
      })); 

      setCustomers(usersData);
    } catch (error: any) {
      console.error("Failed to fetch customers:", error);
      toast({ title: "Erro ao Carregar Clientes", description: error?.message || "Não foi possível carregar a lista de clientes.", variant: "destructive" });
      setCustomers([]);
    } finally {
      setIsLoading(false);
    } 
  };

  useEffect(() => { 
    loadCustomers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    ].filter(Boolean); 
    return parts.join(', ') || 'N/A';
  };

  return (
    <PageContainer className="py-8">
      <AdminPageHeader title="Visualização de Clientes" />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
          <p className="text-muted-foreground">Carregando clientes...</p>
        </div>
      ) : customers.length === 0 ? (
        <Card className="shadow-lg">
          <CardContent className="p-10 text-center flex flex-col items-center">
            <Users size={48} className="mx-auto text-muted-foreground mb-4" />
            <CardTitle className="text-xl font-semibold mb-2">Nenhum Cliente Encontrado</CardTitle>
            <p className="text-muted-foreground">Ainda não há clientes cadastrados no sistema.</p>
          </CardContent>
        </Card>
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
                  <TableCell>{customer.whatsapp}</TableCell>
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
