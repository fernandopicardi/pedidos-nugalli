
"use client";

import { useState, useEffect } from 'react';
import type { PurchaseCycle } from '@/types'; // Import PurchaseCycle
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { PageContainer } from '@/components/shared/page-container';
import { SeasonForm } from '@/components/admin/season-form';
import { PlusCircle, Edit3, Trash2 } from 'lucide-react';
import { fetchSeasons, createSeason, updateSeason, deleteSeason } from '@/lib/supabasePlaceholders';
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

export default function SeasonManagementPage() {
  const [cycles, setCycles] = useState<PurchaseCycle[]>([]); // Use cycles
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<PurchaseCycle | null>(null);
  const { toast } = useToast();

  async function loadCycles() {
    setIsLoading(true);
    try {
      const data = await fetchSeasons(); // TODO: Replace with fetchPurchaseCycles
      setCycles(data as PurchaseCycle[]); // Set to cycles
    } catch (error) {
      console.error("Failed to fetch seasons:", error);
      toast({ title: "Erro ao Carregar", description: "Não foi possível carregar as temporadas.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCycles();
  }, []);

  const handleFormSubmit = async (data: Omit<PurchaseCycle, 'cycleId'> | (Partial<PurchaseCycle> & { cycleId: string })) => {
    try {
      if ('cycleId' in data && data.cycleId) { // Editing existing cycle
        await updatePurchaseCycle(data.cycleId, data); // TODO: Ensure updatePurchaseCycle signature matches
      } else { // Creating new cycle
        await createPurchaseCycle(data as Omit<PurchaseCycle, 'cycleId'>);
      }
      setIsModalOpen(false);
      setEditingCycle(null);
      await loadCycles(); // Refresh list
    } catch (error) {
      console.error("Failed to save purchase cycle:", error);
      toast({ title: "Erro ao Salvar", description: "Não foi possível salvar o ciclo de compra.", variant: "destructive" });
    }
  };

  const openNewSeasonModal = () => {
    setEditingCycle(null); // Use editingCycle
    setIsModalOpen(true);
  };
  const openEditCycleModal = (cycle: PurchaseCycle) => {
    setEditingCycle(cycle);
    setIsModalOpen(true);
  };

  const handleDeleteCycle = async (cycleId: string, cycleName: string) => {
    try {
      await deletePurchaseCycle(cycleId); // Use deletePurchaseCycle
      toast({ title: "Ciclo Deletado", description: `O ciclo "${cycleName}" foi deletado.` });
      await loadCycles(); // Refresh list
    } catch (error) {
      console.error("Failed to delete purchase cycle:", error);
      toast({ title: "Erro ao Deletar", description: "Não foi possível deletar o ciclo de compra.", variant: "destructive" });
    }
  };
  
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });


  return (
    <PageContainer className="py-8">
      <AdminPageHeader
        title="Gerenciamento de Temporadas"
        actionButton={
          <Button onClick={openNewSeasonModal}>
            <PlusCircle size={18} className="mr-2" />
            Nova Temporada
          </Button>
        }
      />

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => { setIsModalOpen(isOpen); if (!isOpen) setEditingSeason(null); }}>
        <DialogContent className="sm:max-w-[600px]">
         <DialogHeader>\
            <DialogTitle>{editingCycle ? \'Editar Ciclo de Compra\' : \'Novo Ciclo de Compra\'}</DialogTitle>\
         </DialogHeader>\
          <SeasonForm
            initialData={editingSeason}
            onSubmit={handleFormSubmit}
            onClose={() => { setIsModalOpen(false); setEditingSeason(null); }}
          />
        </DialogContent>
      </Dialog>

     {isLoading ? (
        <p>Carregando ciclos de compra...</p>
      ) : cycles.length === 0 ? (
         <div className="text-center py-12">
            <p className="text-xl text-muted-foreground mb-4">Nenhum ciclo de compra cadastrado.</p>
            <Button onClick={openNewSeasonModal}>
              <PlusCircle size={18} className="mr-2" />
              Criar Primeira Temporada
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
                <TableHead>Ativa?</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cycles.map((cycle) => (\
                <TableRow key={cycle.cycleId}>
                  <TableCell className="font-medium">{cycle.name}</TableCell>
                  <TableCell>{formatDate(cycle.startDate)}</TableCell>
                  <TableCell>{formatDate(cycle.endDate)}</TableCell>
                  <TableCell>{cycle.isActive ? 'Sim' : 'Não'}</TableCell>
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
                          <AlertDialogAction onClick={() => handleDeleteCycle(cycle.cycleId, cycle.name)}>\
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

