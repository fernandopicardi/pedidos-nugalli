
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import type { CycleProductWithProductDetails } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface EditCycleProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cycleProduct: CycleProductWithProductDetails;
  onSubmit: (data: { priceInCycle: number; isAvailableInCycle: boolean }) => Promise<void>;
}

export function EditCycleProductDialog({ isOpen, onClose, cycleProduct, onSubmit }: EditCycleProductDialogProps) {
  const [priceInCycle, setPriceInCycle] = useState(0);
  const [isAvailableInCycle, setIsAvailableInCycle] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (cycleProduct) {
      setPriceInCycle(cycleProduct.priceInCycle);
      setIsAvailableInCycle(cycleProduct.isAvailableInCycle);
    }
  }, [cycleProduct]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    if (priceInCycle < 0) {
        toast({ title: "Erro de Validação", description: "O preço não pode ser negativo.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }
    try {
      await onSubmit({ priceInCycle, isAvailableInCycle });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!cycleProduct) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-card shadow-lg">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl">Editar Produto no Ciclo</DialogTitle>
          <DialogDescription>
            Ajuste o preço e a disponibilidade de "{cycleProduct.productNameSnapshot}" para este ciclo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div>
            <Label htmlFor="priceInCycle" className="font-semibold">Preço no Ciclo (R$)</Label>
            <Input
              id="priceInCycle"
              type="number"
              value={priceInCycle}
              onChange={(e) => setPriceInCycle(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              required
              className="mt-1"
              disabled={isSubmitting}
            />
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="isAvailableInCycle"
              checked={isAvailableInCycle}
              onCheckedChange={(checked) => setIsAvailableInCycle(Boolean(checked))}
              disabled={isSubmitting}
            />
            <Label htmlFor="isAvailableInCycle" className="font-semibold">Disponível para venda neste ciclo?</Label>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
