
"use client";

import { useState, useEffect } from 'react';
import type { PurchaseCycle } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { PageContainer } from '@/components/shared/page-container';
import { PurchaseCycleForm } from '@/components/admin/purchase-cycle-form';
import { PlusCircle, Edit3, Trash2 } from 'lucide-react';
import { fetchPurchaseCycles, createPurchaseCycle, updatePurchaseCycle, deletePurchaseCycle } from '@/lib/supabasePlaceholders';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';

export default function PurchaseCycleManagementPage() {
  const [purchaseCycles, setPurchaseCycles] = useState<PurchaseCycle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<PurchaseCycle | null>(null);
  const { toast } = useToast();

  async function loadPurchaseCycles() {
    setIsLoading(true);
    try {
      const data = await fetchPurchaseCycles();
      setPurchaseCycles(data);
    } catch (error) {
      console.error("Failed to fetch purchase cycles:", error);
      toast({ title: "Erro ao Carregar", description: "Não foi possível carregar os ciclos de compra.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPurchaseCycles();
  }, []);

  const handleFormSubmit = async (data: Omit<PurchaseCycle, 'cycleId' | 'createdAt'> | (Partial<Omit<PurchaseCycle, 'cycleId' | 'createdAt'>> & { cycleId: string })) => {
    try {
      if ('cycleId' in data && data.cycleId) { // Editing existing cycle
        await updatePurchaseCycle(data.cycleId, data);
      } else { // Creating new cycle
        await createPurchaseCycle(data as Omit<PurchaseCycle, 'cycleId' | 'createdAt'>);
      }
      setIsModalOpen(false);
      setEditingCycle(null);
      await loadPurchaseCycles(); // Refresh list
    } catch (error) {
      console.error("Failed to save purchase cycle:", error);
      // Toast is handled within PurchaseCycleForm
    }
  };

  const openNewCycleModal = () => {
    setEditingCycle(null);
    setIsModalOpen(true);
  };

  const openEditCycleModal = (cycle: PurchaseCycle) => {
    setEditingCycle(cycle);
    setIsModalOpen(true);
  };

  const handleDeleteCycle = async (cycleId: string, cycleName: string) => {
    try {
      await deletePurchaseCycle(cycleId);
      toast({ title: "Ciclo de Compra Deletado", description: `O ciclo "${cycleName}" foi deletado.` });
      await loadPurchaseCycles(); // Refresh list
    } catch (error) {
      console.error("Failed to delete purchase cycle:", error);
      toast({ title: "Erro ao Deletar", description: "Não foi possível deletar o ciclo de compra.", variant: "destructive" });
    }
  };
  
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });


  return (
    <PageContainer className="py-8">
      <AdminPageHeader
        title="Gerenciamento de Ciclos de Compra"
        actionButton={
          <Button onClick={openNewCycleModal}>
            <PlusCircle size={18} className="mr-2" />
            Novo Ciclo de Compra
          </Button>
        }
      />

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => { setIsModalOpen(isOpen); if (!isOpen) setEditingCycle(null); }}>
        <DialogContent className="sm:max-w-[600px] bg-card bg-opacity-85 backdrop-blur-sm shadow-lg">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">
              {editingCycle ? 'Editar Ciclo de Compra' : 'Novo Ciclo de Compra'}
            </DialogTitle>
          </DialogHeader>
          <PurchaseCycleForm
            initialData={editingCycle}
            onSubmit={handleFormSubmit}
            onClose={() => { setIsModalOpen(false); setEditingCycle(null); }}
          />
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <p>Carregando ciclos de compra...</p>
      ) : purchaseCycles.length === 0 ? (
         <div className="text-center py-12 bg-card rounded-lg shadow">
            <p className="text-xl text-muted-foreground mb-4">Nenhum ciclo de compra cadastrado.</p>
            <Button onClick={openNewCycleModal}>
              <PlusCircle size={18} className="mr-2" />
              Criar Primeiro Ciclo
            </Button>
          </div>
      ) : (
        <div className="bg-card p-6 rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Data de Início</TableHead>
                <TableHead>Data de Fim</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseCycles.map((cycle) => (
                <TableRow key={cycle.cycleId}>
                  <TableCell className="font-medium">{cycle.name}</TableCell>
                  <TableCell>{formatDate(cycle.startDate)}</TableCell>
                  <TableCell>{formatDate(cycle.endDate)}</TableCell>
                  <TableCell>
                    <Badge variant={cycle.isActive ? "default" : "secondary"}>
                      {cycle.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEditCycleModal(cycle)}>
                      <Edit3 size={16} className="mr-1" /> Editar
                    </Button>
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 size={16} className="mr-1" /> Deletar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Deleção</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja deletar o ciclo de compra "{cycle.name}"? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteCycle(cycle.cycleId, cycle.name)}>
                            Deletar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
