
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import type { PurchaseCycle } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
// import { supabase } from '@/lib/supabaseClient'; // Not directly used here anymore for DB ops
import { Loader2 } from 'lucide-react';

interface PurchaseCycleFormProps {
  initialData?: PurchaseCycle | null;
  onSubmit: (data: Omit<PurchaseCycle, 'cycleId' | 'createdAt'> | (Partial<Omit<PurchaseCycle, 'cycleId' | 'createdAt'>> & { cycleId: string })) => Promise<void>;
  onClose: () => void;
  isSubmitting?: boolean;
}

export function PurchaseCycleForm({ initialData, onSubmit, onClose, isSubmitting }: PurchaseCycleFormProps) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      // Ensure dates are correctly formatted for datetime-local input
      // It expects YYYY-MM-DDTHH:mm
      setStartDate(initialData.startDate ? new Date(initialData.startDate).toISOString().substring(0, 16) : ''); 
      setEndDate(initialData.endDate ? new Date(initialData.endDate).toISOString().substring(0, 16) : '');
      setIsActive(initialData.isActive);
    } else {
      // Default for new cycle: start today, end in one month
      const now = new Date();
      // Adjust for local timezone to ensure correct default for datetime-local
      const localNow = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
      const today = localNow.toISOString().substring(0, 16);
      
      const nextMonthDate = new Date(new Date(now).setMonth(now.getMonth() + 1));
      const localNextMonth = new Date(nextMonthDate.getTime() - (nextMonthDate.getTimezoneOffset() * 60000));
      const nextMonth = localNextMonth.toISOString().substring(0, 16);
      
      setName('');
      setStartDate(today);
      setEndDate(nextMonth);
      setIsActive(false);
    }
  }, [initialData]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      toast({ title: "Erro de Validação", description: "Nome do ciclo é obrigatório.", variant: "destructive" });
      return;
    }
    if (!startDate || !endDate) {
      toast({ title: "Erro de Validação", description: "Datas de início e fim são obrigatórias.", variant: "destructive" });
      return;
    }
    if (new Date(startDate) >= new Date(endDate)) {
      toast({ title: "Erro de Validação", description: "A data de início deve ser anterior à data de fim.", variant: "destructive" });
      return;
    }

    const cycleDataPayload = { 
      name, 
      // Convert local datetime-local string back to full ISO string for Supabase
      startDate: new Date(startDate).toISOString(), 
      endDate: new Date(endDate).toISOString(),   
      isActive 
    };
    
    const isEditingForm = initialData?.cycleId && typeof initialData.cycleId === 'string' && initialData.cycleId.length > 0;

    if (isEditingForm) {
      // Pass cycleId along with other data for an update
      await onSubmit({ ...cycleDataPayload, cycleId: initialData.cycleId as string }); 
    } else {
      // No cycleId for a new cycle
      await onSubmit(cycleDataPayload as Omit<PurchaseCycle, 'cycleId' | 'createdAt'>);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto p-1 pr-4">
      <div>
        <Label htmlFor="cycle-name" className="font-semibold">Nome do Ciclo de Compra</Label>
        <Input
          id="cycle-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1"
          placeholder="Ex: Páscoa 2025, Dia das Mães"
          disabled={isSubmitting}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start-date" className="font-semibold">Data e Hora de Início</Label>
          <Input
            id="start-date"
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="mt-1"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <Label htmlFor="end-date" className="font-semibold">Data e Hora de Fim</Label>
          <Input
            id="end-date"
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            className="mt-1"
            disabled={isSubmitting}
          />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="is-active"
          checked={isActive}
          onCheckedChange={(checked) => setIsActive(Boolean(checked))}
          disabled={isSubmitting}
        />
        <Label htmlFor="is-active" className="font-semibold">Ativar este ciclo?</Label>
      </div>
      <p className="text-xs text-muted-foreground">Somente um ciclo pode estar ativo por vez. Ativar este ciclo desativará outros automaticamente (lógica implementada na função de criar/atualizar ciclo na página).</p>
      
      <div className="flex justify-end space-x-3 pt-4 border-t sticky bottom-0 bg-card py-3">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? (initialData ? 'Salvando...' : 'Criando...') : (initialData ? 'Salvar Alterações' : 'Criar Ciclo')}
        </Button>
      </div>
    </form>
  );
}
    
