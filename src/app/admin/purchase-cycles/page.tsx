
'use client';

import { useState, useEffect, useCallback }
from 'react';
import type { PurchaseCycle } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle as FormDialogTitle } from '@/components/ui/dialog'; // Renamed DialogTitle to avoid conflict
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { PageContainer } from '@/components/shared/page-container';
import { PurchaseCycleForm } from '@/components/admin/purchase-cycle-form';
import { PlusCircle, Edit3, Trash2, Loader2, CalendarOff, Settings2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
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
import { Card, CardContent, CardTitle } from '@/components/ui/card'; // Added Card imports

export default function PurchaseCycleManagementPage() {
  const [purchaseCycles, setPurchaseCycles] = useState<PurchaseCycle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<PurchaseCycle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const loadPurchaseCycles = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('purchase_cycles')
        .select('cycle_id, name, start_date, end_date, is_active, created_at, description') 
        .order('start_date', { ascending: false });
      
      if (error) throw error;

      if (data) {
        const mappedData = data.map(dbCycle => ({
          cycleId: dbCycle.cycle_id,
          name: dbCycle.name,
          startDate: dbCycle.start_date,
          endDate: dbCycle.end_date,
          isActive: dbCycle.is_active,
          description: dbCycle.description, 
          createdAt: dbCycle.created_at
        } as PurchaseCycle));
        setPurchaseCycles(mappedData);
      } else {
        setPurchaseCycles([]);
      }
    } catch (error: any) {
      toast({ title: "Erro ao Carregar", description: error?.message || "Não foi possível carregar os ciclos de compra.", variant: "destructive" });
      setPurchaseCycles([]);
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
    
    const typedFormData = formData as Partial<PurchaseCycle> & { cycleId?: string };
    const isEditing = typedFormData.cycleId && typeof typedFormData.cycleId === 'string' && typedFormData.cycleId.length > 0;
    const cycleIdToUpdate = isEditing ? typedFormData.cycleId : undefined;
    
    try {
      const dbPayload: {
        name: string;
        start_date: string;
        end_date: string;
        is_active: boolean;
        description?: string | null; 
      } = {
        name: formData.name!, 
        start_date: formData.startDate!,
        end_date: formData.endDate!,
        is_active: formData.isActive!,
        description: formData.description || null, 
      };

      if (isEditing && cycleIdToUpdate) {
        if (dbPayload.is_active) {
            const { error: deactivateError } = await supabase
                .from('purchase_cycles')
                .update({ is_active: false })
                .eq('is_active', true)
                .neq('cycle_id', cycleIdToUpdate);
            if (deactivateError) {
                console.warn("Error deactivating other cycles:", deactivateError.message);
            }
        }
        const { data: updatedDataArray, error: updateError } = await supabase
          .from('purchase_cycles')
          .update(dbPayload)
          .eq('cycle_id', cycleIdToUpdate)
          .select();

        if (updateError) throw updateError;
        
        if (!updatedDataArray || updatedDataArray.length === 0) {
          throw new Error("Falha ao obter dados atualizados do ciclo após a atualização, ou o ciclo não foi encontrado.");
        }
        const updatedDbCycle = updatedDataArray[0];
        
        const updatedFrontendCycle: PurchaseCycle = {
          cycleId: updatedDbCycle.cycle_id,
          name: updatedDbCycle.name,
          startDate: updatedDbCycle.start_date,
          endDate: updatedDbCycle.end_date,
          isActive: updatedDbCycle.is_active,
          description: updatedDbCycle.description, 
          createdAt: updatedDbCycle.created_at,
        };

        setPurchaseCycles(prevCycles =>
          prevCycles.map(c =>
            c.cycleId === updatedFrontendCycle.cycleId ? updatedFrontendCycle : c
          )
        );
        successMessage = `Ciclo "${updatedFrontendCycle.name}" atualizado com sucesso.`;

      } else { 
        if (dbPayload.is_active) {
            const { error: deactivateError } = await supabase
                .from('purchase_cycles')
                .update({ is_active: false })
                .eq('is_active', true);
            if (deactivateError) {
                console.warn("Error deactivating other cycles:", deactivateError.message);
            }
        }
        const { data: insertedDbData, error: insertError } = await supabase
          .from('purchase_cycles')
          .insert(dbPayload)
          .select() 
          .single(); 
        if (insertError) throw insertError;
        if (!insertedDbData) {
          throw new Error("Falha ao obter dados do ciclo após a criação.");
        }
        successMessage = `Ciclo "${insertedDbData.name}" criado com sucesso.`;
      }
      
      toast({ title: "Sucesso!", description: successMessage });
      setIsModalOpen(false);
      setEditingCycle(null);
      await loadPurchaseCycles();
    } catch (error: any) {
      console.error("Failed to save purchase cycle:", error);
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
    setEditingCycle(cycle);
    setIsModalOpen(true);
  };

  const handleDeleteCycle = async (cycleIdToDelete: string, cycleName: string) => {
     if (!cycleIdToDelete || typeof cycleIdToDelete !== 'string' || cycleIdToDelete.trim() === '') {
      toast({
        title: "Erro Interno",
        description: "ID do ciclo inválido ou ausente. Não é possível deletar.",
        variant: "destructive",
      });
      console.error("[PurchaseCyclePage] handleDeleteCycle - Aborted: cycleIdToDelete is invalid.", cycleIdToDelete);
      return; 
    }
    setIsLoading(true); 
    try {
      const { error } = await supabase
        .from('purchase_cycles')
        .delete()
        .eq('cycle_id', cycleIdToDelete); 
      
      if (error) throw error;

      toast({ title: "Ciclo de Compra Deletado", description: `O ciclo "${cycleName}" foi deletado.` });
      await loadPurchaseCycles();
    } catch (error: any) {
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
        <DialogContent 
          key={editingCycle ? `form-instance-${editingCycle.cycleId}` : 'form-instance-new'} 
          className="sm:max-w-[600px] bg-card shadow-lg"
        >
          <DialogHeader>
            <FormDialogTitle className="font-headline text-2xl">
              {editingCycle ? 'Editar Ciclo de Compra' : 'Novo Ciclo de Compra'}
            </FormDialogTitle>
          </DialogHeader>
          <PurchaseCycleForm
            key={editingCycle ? `form-instance-${editingCycle.cycleId}` : 'form-instance-new-cycle-form'} 
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
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
          <p className="text-muted-foreground">Carregando ciclos de compra...</p>
        </div>
      ) : !isLoading && purchaseCycles.length === 0 ? (
        <Card className="shadow-lg">
            <CardContent className="p-10 text-center flex flex-col items-center">
                <CalendarOff size={48} className="mx-auto text-muted-foreground mb-4" />
                <CardTitle className="text-xl font-semibold mb-2">Nenhum Ciclo de Compra Cadastrado</CardTitle>
                <p className="text-muted-foreground mb-6">Você ainda não criou nenhum ciclo de compra.</p>
                <Button onClick={openNewCycleModal}>
                    <PlusCircle size={18} className="mr-2" />
                    Criar Primeiro Ciclo
                </Button>
            </CardContent>
        </Card>
      ) : (
        <div className="bg-card p-6 rounded-lg shadow relative">
          {isLoading && <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="w-[250px]">Descrição Curta</TableHead>
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
                  <TableCell className="text-xs max-w-xs truncate" title={cycle.description}>
                    {cycle.description ? `${cycle.description.substring(0, 50)}...` : 'N/A'}
                  </TableCell>
                  <TableCell>{formatDate(cycle.startDate)}</TableCell>
                  <TableCell>{formatDate(cycle.endDate)}</TableCell>
                  <TableCell>
                    <Badge variant={cycle.isActive ? "default" : "secondary"}>
                      {cycle.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/purchase-cycles/${cycle.cycleId}/manage-products`}>
                        <Settings2 size={16} className="mr-1" /> Ger. Produtos
                      </Link>
                    </Button>
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
                            Tem certeza que deseja deletar o ciclo de compra "{cycle.name}"? Esta ação não pode ser desfeita. Deletar um ciclo removerá todos os produtos associados exclusivamente a ele.
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

