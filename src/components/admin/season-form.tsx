"use client";

import { useState, useEffect, type FormEvent } from 'react';
import type { Season } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

interface SeasonFormProps {
  initialData?: Season | null;
  onSubmit: (data: Omit<Season, 'id'> | (Partial<Season> & { id: string })) => Promise<void>;
  onClose: () => void;
}

export function SeasonForm({ initialData, onSubmit, onClose }: SeasonFormProps) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setStartDate(initialData.startDate.split('T')[0]); // Format for date input
      setEndDate(initialData.endDate.split('T')[0]);     // Format for date input
      setIsActive(initialData.isActive);
    } else {
      // Set default dates for new season if desired
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setEndDate(nextMonth.toISOString().split('T')[0]);
    }
  }, [initialData]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const seasonData = { 
        name, 
        startDate: new Date(startDate).toISOString(), 
        endDate: new Date(endDate).toISOString(), 
        isActive 
      };
      if (initialData?.id) {
        await onSubmit({ ...seasonData, id: initialData.id });
        toast({ title: "Temporada Atualizada", description: `A temporada "${name}" foi atualizada com sucesso.` });
      } else {
        await onSubmit(seasonData);
        toast({ title: "Temporada Criada", description: `A temporada "${name}" foi criada com sucesso.` });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save season:", error);
      toast({ title: "Erro ao Salvar", description: "Não foi possível salvar a temporada.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="season-name" className="font-semibold">Nome da Temporada</Label>
        <Input
          id="season-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start-date" className="font-semibold">Data de Início</Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="end-date" className="font-semibold">Data de Fim</Label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className="mt-1"
          />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="is-active"
          checked={isActive}
          onCheckedChange={(checked) => setIsActive(Boolean(checked))}
        />
        <Label htmlFor="is-active" className="font-semibold">Ativa?</Label>
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (initialData ? 'Salvando...' : 'Criando...') : (initialData ? 'Salvar Alterações' : 'Criar Temporada')}
        </Button>
      </div>
    </form>
  );
}
