
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import type { Product as MasterProduct } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PackagePlus, Search } from 'lucide-react';
import Image from 'next/image';

interface AddProductToCycleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cycleId: string;
  cycleName: string;
  masterProducts: MasterProduct[];
  isLoadingMasterProducts: boolean;
  onSubmit: (masterProductId: string, price: number, isAvailable: boolean, nameSnapshot: string, imageSnapshotUrl?: string) => Promise<void>;
  existingCycleProductIds: string[]; // Array of product_id already in the cycle
}

export function AddProductToCycleDialog({
  isOpen,
  onClose,
  cycleName,
  masterProducts,
  isLoadingMasterProducts,
  onSubmit,
  existingCycleProductIds
}: AddProductToCycleDialogProps) {
  const [selectedMasterProductId, setSelectedMasterProductId] = useState<string | null>(null);
  const [priceInCycle, setPriceInCycle] = useState(0);
  const [isAvailableInCycle, setIsAvailableInCycle] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setSelectedMasterProductId(null);
      setPriceInCycle(0);
      setIsAvailableInCycle(true);
      setSearchTerm('');
    }
  }, [isOpen]);

  const filteredMasterProducts = masterProducts.filter(
    (p) => !existingCycleProductIds.includes(p.productId) &&
           p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedMasterProductId) {
      toast({ title: "Seleção Necessária", description: "Por favor, selecione um produto mestre para adicionar.", variant: "destructive" });
      return;
    }
    if (priceInCycle < 0) {
        toast({ title: "Preço Inválido", description: "O preço não pode ser negativo.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    const selectedProduct = masterProducts.find(p => p.productId === selectedMasterProductId);
    if (!selectedProduct) {
        toast({ title: "Erro", description: "Produto mestre selecionado não encontrado.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }
    try {
      await onSubmit(selectedMasterProductId, priceInCycle, isAvailableInCycle, selectedProduct.name, selectedProduct.imageUrl);
      onClose(); // Close dialog on successful submit
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProductSelect = (product: MasterProduct) => {
    setSelectedMasterProductId(product.productId);
    // You could pre-fill price from a base_price if it existed on MasterProduct
    // setPriceInCycle(product.basePrice || 0); 
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col bg-card shadow-lg">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl">Adicionar Produto ao Ciclo: {cycleName}</DialogTitle>
          <DialogDescription>
            Selecione um produto do catálogo mestre e defina seu preço e disponibilidade para este ciclo.
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative my-4">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar produto mestre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 w-full"
          />
        </div>

        <ScrollArea className="flex-grow border rounded-md p-1 mb-4 min-h-[200px]">
          {isLoadingMasterProducts ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredMasterProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <PackagePlus size={32} className="text-muted-foreground mb-2"/>
                <p className="text-muted-foreground">
                    {masterProducts.length > 0 && existingCycleProductIds.length === masterProducts.length ? 
                     "Todos os produtos mestre já estão neste ciclo." : 
                     "Nenhum produto mestre encontrado com o termo buscado ou para adicionar."}
                </p>
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {filteredMasterProducts.map(product => (
                <button
                  key={product.productId}
                  onClick={() => handleProductSelect(product)}
                  className={
                    `w-full text-left p-2 rounded-md border flex items-center gap-3 transition-colors
                     ${selectedMasterProductId === product.productId ? 'bg-primary/10 border-primary ring-1 ring-primary' : 'hover:bg-muted/50'}`
                  }
                >
                  <Image 
                    src={product.imageUrl || 'https://placehold.co/40x40.png?text=Img'} 
                    alt={product.name} 
                    width={40} 
                    height={40} 
                    className="rounded object-cover flex-shrink-0"
                    data-ai-hint="chocolate product"
                  />
                  <div className="flex-grow">
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-xs sm:max-w-sm md:max-w-md">{product.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {selectedMasterProductId && (
          <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
            <p className="text-sm font-medium">Configurar "{masterProducts.find(p=>p.productId === selectedMasterProductId)?.name}" para este ciclo:</p>
            <div>
              <Label htmlFor="priceInCycleAdd" className="font-semibold">Preço no Ciclo (R$)</Label>
              <Input
                id="priceInCycleAdd"
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
            <div className="flex items-center space-x-2 pt-1">
              <Checkbox
                id="isAvailableInCycleAdd"
                checked={isAvailableInCycle}
                onCheckedChange={(checked) => setIsAvailableInCycle(Boolean(checked))}
                disabled={isSubmitting}
              />
              <Label htmlFor="isAvailableInCycleAdd" className="font-semibold">Disponível para venda neste ciclo?</Label>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !selectedMasterProductId}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Adicionar ao Ciclo
              </Button>
            </DialogFooter>
          </form>
        )}
        {!selectedMasterProductId && (
             <DialogFooter className="pt-4 mt-auto">
              <Button type="button" variant="outline" onClick={onClose}>
                Fechar
              </Button>
            </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

