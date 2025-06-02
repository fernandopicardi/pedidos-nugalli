"use client";

import { useState, useEffect } from 'react';
import type { Season } from '@/types';
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
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const { toast } = useToast();

  async function loadSeasons() {
    setIsLoading(true);
    try {
      const data = await fetchSeasons();
      setSeasons(data);
    } catch (error) {
      console.error("Failed to fetch seasons:", error);
      toast({ title: "Erro ao Carregar", description: "Não foi possível carregar as temporadas.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSeasons();
  }, []);

  const handleFormSubmit = async (data: Omit<Season, 'id'> | (Partial<Season> & { id: string })) => {
    try {
      if ('id' in data && data.id) { // Editing existing season
        await updateSeason(data.id, data);
      } else { // Creating new season
        await createSeason(data as Omit<Season, 'id'>);
      }
      setIsModalOpen(false);
      setEditingSeason(null);
      await loadSeasons(); // Refresh list
    } catch (error) {
      console.error("Failed to save season:", error);
      // Toast is handled within SeasonForm, but can add specific one here if needed.
    }
  };

  const openNewSeasonModal = () => {
    setEditingSeason(null);
    setIsModalOpen(true);
  };

  const openEditSeasonModal = (season: Season) => {
    setEditingSeason(season);
    setIsModalOpen(true);
  };

  const handleDeleteSeason = async (seasonId: string, seasonName: string) => {
    try {
      await deleteSeason(seasonId);
      toast({ title: "Temporada Deletada", description: `A temporada "${seasonName}" foi deletada.` });
      await loadSeasons(); // Refresh list
    } catch (error) {
      console.error("Failed to delete season:", error);
      toast({ title: "Erro ao Deletar", description: "Não foi possível deletar a temporada.", variant: "destructive" });
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
        <DialogContent className="sm:max-w-[600px] bg-card bg-opacity-85 backdrop-blur-sm shadow-lg">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">
              {editingSeason ? 'Editar Temporada' : 'Nova Temporada'}
            </DialogTitle>
          </DialogHeader>
          <SeasonForm
            initialData={editingSeason}
            onSubmit={handleFormSubmit}
            onClose={() => { setIsModalOpen(false); setEditingSeason(null); }}
          />
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <p>Carregando temporadas...</p>
      ) : seasons.length === 0 ? (
         <div className="text-center py-12 bg-card rounded-lg shadow">
            <p className="text-xl text-muted-foreground mb-4">Nenhuma temporada cadastrada.</p>
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
              {seasons.map((season) => (
                <TableRow key={season.id}>
                  <TableCell className="font-medium">{season.name}</TableCell>
                  <TableCell>{formatDate(season.startDate)}</TableCell>
                  <TableCell>{formatDate(season.endDate)}</TableCell>
                  <TableCell>{season.isActive ? 'Sim' : 'Não'}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEditSeasonModal(season)}>
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
                            Tem certeza que deseja deletar a temporada "{season.name}"? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteSeason(season.id, season.name)}>
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
