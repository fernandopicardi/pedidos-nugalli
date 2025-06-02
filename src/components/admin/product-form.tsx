"use client";

import { useState, useEffect, type FormEvent } from 'react';
import type { Product, Season } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { fetchSeasons } from '@/lib/supabasePlaceholders'; // To populate season dropdown

interface ProductFormProps {
  initialData?: Product | null;
  onSubmit: (data: Omit<Product, 'id' | 'imageUrl'> & { imageUrl?: string } | (Partial<Product> & { id: string })) => Promise<void>;
  onClose: () => void;
}

export function ProductForm({ initialData, onSubmit, onClose }: ProductFormProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number | string>('');
  const [description, setDescription] = useState('');
  const [seasonId, setSeasonId] = useState<string | undefined>(undefined);
  const [imageUrl, setImageUrl] = useState(''); // For display/new URL input
  // In a real app, you'd handle image uploads separately. For now, it's a URL.
  
  const [availableSeasons, setAvailableSeasons] = useState<Season[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function loadSeasons() {
      try {
        const seasons = await fetchSeasons();
        setAvailableSeasons(seasons);
        if (!initialData?.seasonId && seasons.length > 0) {
           // setSeasonId(seasons[0].id); // Default to first season if none selected for new product
        }
      } catch (error) {
        console.error("Failed to fetch seasons for product form:", error);
        toast({ title: "Erro", description: "Não foi possível carregar as temporadas.", variant: "destructive" });
      }
    }
    loadSeasons();

    if (initialData) {
      setName(initialData.name);
      setPrice(initialData.price);
      setDescription(initialData.description || '');
      setSeasonId(initialData.seasonId || undefined);
      setImageUrl(initialData.imageUrl); // Existing image URL
    }
  }, [initialData, toast]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    const numericPrice = parseFloat(String(price));
    if (isNaN(numericPrice) || numericPrice <= 0) {
      toast({ title: "Erro de Validação", description: "Por favor, insira um preço válido.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    try {
      const productData = { 
        name, 
        price: numericPrice,
        description,
        seasonId,
        imageUrl: imageUrl || 'https://placehold.co/400x300.png?text=Novo+Produto', // Default placeholder if empty
      };

      if (initialData?.id) {
        await onSubmit({ ...productData, id: initialData.id });
        toast({ title: "Produto Atualizado", description: `O produto "${name}" foi atualizado.` });
      } else {
        await onSubmit(productData as Omit<Product, 'id'>); // imageUrl is handled
        toast({ title: "Produto Criado", description: `O produto "${name}" foi criado.` });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save product:", error);
      toast({ title: "Erro ao Salvar", description: "Não foi possível salvar o produto.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="product-name" className="font-semibold">Nome do Produto</Label>
        <Input id="product-name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="product-price" className="font-semibold">Preço (R$)</Label>
          <Input id="product-price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required step="0.01" min="0" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="product-season" className="font-semibold">Temporada Associada</Label>
          <Select value={seasonId} onValueChange={setSeasonId}>
            <SelectTrigger className="w-full mt-1">
              <SelectValue placeholder="Selecione uma temporada" />
            </SelectTrigger>
            <SelectContent>
              {availableSeasons.map(season => (
                <SelectItem key={season.id} value={season.id}>{season.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="product-description" className="font-semibold">Descrição</Label>
        <Textarea id="product-description" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" rows={4} />
      </div>

      <div>
        <Label htmlFor="product-image-url" className="font-semibold">URL da Imagem do Produto</Label>
        <Input id="product-image-url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://exemplo.com/imagem.png" className="mt-1" />
        {imageUrl && <img src={imageUrl} alt="Preview" className="mt-2 h-24 w-24 object-cover rounded-md border" data-ai-hint="chocolate product" />}
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (initialData ? 'Salvando...' : 'Criando...') : (initialData ? 'Salvar Alterações' : 'Criar Produto')}
        </Button>
      </div>
    </form>
  );
}
