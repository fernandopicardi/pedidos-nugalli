
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import type { Product } from '@/types'; // Master Product type
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

// This form now manages master Product details.
// Linking products to PurchaseCycles (CycleProducts) will be handled elsewhere.

interface ProductFormProps {
  initialData?: Product | null;
  onSubmit: (data: Omit<Product, 'productId' | 'createdAt' | 'updatedAt'> | (Partial<Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>> & { productId: string })) => Promise<void>;
  onClose: () => void;
}

export function ProductForm({ initialData, onSubmit, onClose }: ProductFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>(['']); // Start with one empty URL field
  // Attributes are a Record<string, string[]>, e.g., { "dietary": ["vegano", "sem glúten"] }
  // For simplicity in this MVP form, we'll handle attributes as a JSON string textarea.
  const [attributesString, setAttributesString] = useState('{}');
  const [isSeasonal, setIsSeasonal] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description);
      setImageUrls(initialData.imageUrls && initialData.imageUrls.length > 0 ? initialData.imageUrls : ['']);
      setAttributesString(JSON.stringify(initialData.attributes || {}, null, 2));
      setIsSeasonal(initialData.isSeasonal);
    } else {
      // Defaults for new product
      setName('');
      setDescription('');
      setImageUrls(['']);
      setAttributesString('{}');
      setIsSeasonal(true);
    }
  }, [initialData]);

  const handleImageUrlsChange = (index: number, value: string) => {
    const newImageUrls = [...imageUrls];
    newImageUrls[index] = value;
    setImageUrls(newImageUrls);
  };

  const addImageUrlField = () => {
    setImageUrls([...imageUrls, '']);
  };

  const removeImageUrlField = (index: number) => {
    if (imageUrls.length > 1) {
      const newImageUrls = imageUrls.filter((_, i) => i !== index);
      setImageUrls(newImageUrls);
    } else {
      // If only one field left, clear it instead of removing
      setImageUrls(['']);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    let parsedAttributes: Record<string, string[]>;
    try {
      parsedAttributes = JSON.parse(attributesString);
    } catch (e) {
      toast({ title: "Erro de Validação", description: "Formato JSON inválido para atributos.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    if (!name.trim()) {
      toast({ title: "Erro de Validação", description: "Nome do produto é obrigatório.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    
    const finalImageUrls = imageUrls.map(url => url.trim()).filter(url => url !== '');
    if (finalImageUrls.length === 0) {
        finalImageUrls.push('https://placehold.co/400x300.png?text=Produto');
    }


    try {
      const productData = { 
        name, 
        description,
        imageUrls: finalImageUrls,
        attributes: parsedAttributes,
        isSeasonal,
      };

      if (initialData?.productId) {
        await onSubmit({ ...productData, productId: initialData.productId });
        toast({ title: "Produto Atualizado", description: `O produto "${name}" foi atualizado.` });
      } else {
        await onSubmit(productData as Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>);
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
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto p-1 pr-4">
      <div>
        <Label htmlFor="product-name" className="font-semibold">Nome do Produto (Mestre)</Label>
        <Input id="product-name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1" />
      </div>
      
      <div>
        <Label htmlFor="product-description" className="font-semibold">Descrição Detalhada</Label>
        <Textarea id="product-description" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" rows={4} />
      </div>

      <div>
        <Label className="font-semibold">URLs das Imagens</Label>
        {imageUrls.map((url, index) => (
          <div key={index} className="flex items-center space-x-2 mt-1">
            <Input 
              type="url"
              value={url} 
              onChange={(e) => handleImageUrlsChange(index, e.target.value)} 
              placeholder="https://exemplo.com/imagem.png"
            />
            {imageUrls.length > 1 && (
              <Button type="button" variant="ghost" size="sm" onClick={() => removeImageUrlField(index)}>Remover</Button>
            )}
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addImageUrlField} className="mt-2">
          Adicionar URL de Imagem
        </Button>
        {imageUrls.filter(url => url.trim())[0] && <img src={imageUrls.filter(url => url.trim())[0]} alt="Preview" className="mt-2 h-24 w-24 object-cover rounded-md border" data-ai-hint="chocolate product"/>}
      </div>

      <div>
        <Label htmlFor="product-attributes" className="font-semibold">Atributos (JSON)</Label>
        <Textarea 
          id="product-attributes" 
          value={attributesString} 
          onChange={(e) => setAttributesString(e.target.value)} 
          className="mt-1 font-mono" 
          rows={5}
          placeholder='{\n  "dietary": ["vegano", "sem glúten"],\n  "allergen": ["nozes"]\n}'
        />
        <p className="text-xs text-muted-foreground mt-1">Ex: {"{\"peso\": [\"500g\"], \"tipo\": [\"Amargo\"]}"}</p>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id="is-seasonal"
          checked={isSeasonal}
          onCheckedChange={(checked) => setIsSeasonal(Boolean(checked))}
        />
        <Label htmlFor="is-seasonal" className="font-semibold">É um produto primariamente sazonal?</Label>
      </div>
      
      <div className="flex justify-end space-x-3 pt-4 border-t sticky bottom-0 bg-card py-3">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (initialData ? 'Salvando...' : 'Criando...') : (initialData ? 'Salvar Alterações' : 'Criar Produto Mestre')}
        </Button>
      </div>
    </form>
  );
}
