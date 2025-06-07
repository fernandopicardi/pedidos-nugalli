
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PurchaseCycle } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { PageContainer } from '@/components/shared/page-container';
import { PurchaseCycleForm } from '@/components/admin/purchase-cycle-form';
import { PlusCircle, Edit3, Trash2, Loader2 } from 'lucide-react';
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
import { supabase } from '@/lib/supabaseClient';

export default function PurchaseCycleManagementPage() {
  const [purchaseCycles, setPurchaseCycles] = useState<PurchaseCycle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<PurchaseCycle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const loadPurchaseCycles = useCallback(async () => {
    console.log('[PurchaseCyclePage] loadPurchaseCycles called');
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('purchase_cycles')
        .select('*') 
        .order('start_date', { ascending: false });
      
      if (error) throw error;

      if (data) {
        console.log('[PurchaseCyclePage] loadPurchaseCycles - Raw data from Supabase (first 2):', JSON.stringify(data.slice(0, 2), null, 2));
      } else {
        console.log('[PurchaseCyclePage] loadPurchaseCycles - No data received from Supabase.');
      }

      setPurchaseCycles(data.map(dbCycle => {
        console.log('[PurchaseCyclePage] loadPurchaseCycles - Mapping dbCycle:', JSON.stringify(dbCycle));
        // Assuming the primary key column in your Supabase table 'purchase_cycles' is 'cycle_id'
        const mappedCycle = { 
          cycleId: dbCycle.cycle_id, 
          name: dbCycle.name, 
          startDate: dbCycle.start_date, 
          endDate: dbCycle.end_date, 
          isActive: dbCycle.is_active, 
          createdAt: dbCycle.created_at 
        } as PurchaseCycle;
        console.log('[PurchaseCyclePage] loadPurchaseCycles - Mapped cycle object:', JSON.stringify(mappedCycle));
        return mappedCycle;
      }));
    } catch (error: any) {
      console.error('[PurchaseCyclePage] Failed to fetch purchase cycles:', error);
      toast({ title: "Erro ao Carregar", description: error?.message || "Não foi possível carregar os ciclos de compra.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPurchaseCycles();
  }, [loadPurchaseCycles]);

  const handleFormSubmit = async (formData: Omit<PurchaseCycle, 'cycleId' | 'createdAt'> | (Partial<Omit<PurchaseCycle, 'cycleId' | 'createdAt'>> & { cycleId: string })) => {
    setIsSubmitting(true);
    let successMessage = "";
    
    // Explicitly type formData for checking cycleId
    const typedFormData = formData as (Partial<Omit<PurchaseCycle, 'cycleId' | 'createdAt'>> & { cycleId?: string });
    const isEditing = typedFormData.cycleId && typeof typedFormData.cycleId === 'string' && typedFormData.cycleId.length > 0;
    const cycleIdToUpdate = isEditing ? typedFormData.cycleId : undefined;
    
    try {
      const dbPayload = {
        name: formData.name,
        start_date: formData.startDate,
        end_date: formData.endDate,
        is_active: formData.isActive,
      };

      if (isEditing && cycleIdToUpdate) { 
        const { error: updateError } = await supabase
          .from('purchase_cycles')
          .update(dbPayload)
          .eq('cycle_id', cycleIdToUpdate); // Assumes DB column is 'cycle_id'
        if (updateError) throw updateError;
        successMessage = `Ciclo "${formData.name}" atualizado com sucesso.`;
      } else { 
        const { error: insertError } = await supabase
          .from('purchase_cycles')
          .insert(dbPayload);
        if (insertError) throw insertError;
        successMessage = `Ciclo "${formData.name}" criado com sucesso.`;
      }
      
      toast({ title: "Sucesso!", description: successMessage });
      setIsModalOpen(false);
      setEditingCycle(null);
      await loadPurchaseCycles();
    } catch (error: any) {
      console.error('[PurchaseCyclePage] Failed to save purchase cycle:', error);
      toast({ title: "Erro ao Salvar", description: error.message || "Não foi possível salvar o ciclo de compra.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openNewCycleModal = () => {
    setEditingCycle(null);
    setIsModalOpen(true);
  };

  const openEditCycleModal = (cycle: PurchaseCycle) => {
    console.log('[PurchaseCyclePage] openEditCycleModal called with cycleId:', cycle.cycleId, 'Full cycle:', JSON.stringify(cycle));
    setEditingCycle(cycle);
    setIsModalOpen(true);
  };

  const handleDeleteCycle = async (cycleIdToDelete: string, cycleName: string) => {
    console.log('[PurchaseCyclePage] handleDeleteCycle called for cycleId:', cycleIdToDelete, 'Name:', cycleName);

    if (!cycleIdToDelete || typeof cycleIdToDelete !== 'string' || cycleIdToDelete.trim() === '') {
      toast({
        title: "Erro Interno",
        description: "ID do ciclo inválido ou ausente. Não é possível deletar.",
        variant: "destructive",
      });
      console.error('[PurchaseCyclePage] handleDeleteCycle: cycleIdToDelete is invalid or missing. Value:', cycleIdToDelete);
      return; 
    }

    setIsLoading(true); 
    try {
      const { error } = await supabase
        .from('purchase_cycles')
        .delete()
        .eq('cycle_id', cycleIdToDelete); // Assumes DB column is 'cycle_id'
      
      if (error) throw error;

      toast({ title: "Ciclo de Compra Deletado", description: `O ciclo "${cycleName}" foi deletado.` });
      await loadPurchaseCycles();
    } catch (error: any) {
      console.error('[PurchaseCyclePage] Failed to delete purchase cycle:', error);
      toast({ title: "Erro ao Deletar", description: error.message || "Não foi possível deletar o ciclo de compra.", variant: "destructive" });
    } finally {
      setIsLoading(false); 
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

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => { 
          setIsModalOpen(isOpen); 
          if (!isOpen) {
            setEditingCycle(null); 
          }
        }}>
        <DialogContent key={editingCycle ? `modal-${editingCycle.cycleId}` : 'modal-new-cycle'} className="sm:max-w-[600px] bg-card shadow-lg">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">
              {editingCycle ? 'Editar Ciclo de Compra' : 'Novo Ciclo de Compra'}
            </DialogTitle>
          </DialogHeader>
          <PurchaseCycleForm
            key={editingCycle ? `form-${editingCycle.cycleId}` : 'form-new'}
            initialData={editingCycle}
            onSubmit={handleFormSubmit}
            onClose={() => { 
              setIsModalOpen(false); 
              setEditingCycle(null); 
            }}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {isLoading && purchaseCycles.length === 0 ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
          <p>Carregando ciclos de compra...</p>
        </div>
      ) : !isLoading && purchaseCycles.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg shadow">
          <p className="text-xl text-muted-foreground mb-4">Nenhum ciclo de compra cadastrado.</p>
          <Button onClick={openNewCycleModal}>
            <PlusCircle size={18} className="mr-2" />
            Criar Primeiro Ciclo
          </Button>
        </div>
      ) : (
        <div className="bg-card p-6 rounded-lg shadow">
          {isLoading && <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
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
                // Make sure cycle.cycleId has a valid value here for the key
                <TableRow key={cycle.cycleId || `cycle-fallback-${Math.random()}`}> 
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
                        <Button variant="destructive" size="sm" disabled={!cycle.cycleId}>
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
    
