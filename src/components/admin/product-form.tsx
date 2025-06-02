
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import type { Product } from '@/types'; // Master Product type
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

interface ProductFormProps {
  initialData?: Product | null;
  onSubmit: (data: Omit<Product, 'productId' | 'createdAt' | 'updatedAt'> | (Partial<Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>> & { productId: string })) => Promise<void>;
  onClose: () => void;
}

const CATEGORIA_OPTIONS = ["Barra", "Tablete", "Pastilhas", "Granel", "Gotas", "Recheado"];
const DIETARY_OPTIONS = ["vegano", "sem glúten", "sem lactose", "KOSHER", "ZERO AÇÚCAR"];


export function ProductForm({ initialData, onSubmit, onClose }: ProductFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [isSeasonal, setIsSeasonal] = useState(true);
  
  // New state for specific attributes
  const [selectedCategorias, setSelectedCategorias] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [productPeso, setProductPeso] = useState('');
  const [productCacau, setProductCacau] = useState('');
  const [productUnidade, setProductUnidade] = useState('');
  // Add other common attributes as needed, e.g., sabor: string[]
  const [productSabor, setProductSabor] = useState(''); // Example for an attribute like 'sabor'

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description);
      setImageUrls(initialData.imageUrls && initialData.imageUrls.length > 0 ? initialData.imageUrls : ['']);
      setIsSeasonal(initialData.isSeasonal);

      // Populate specific attribute states
      setSelectedCategorias(initialData.attributes?.categoria || []);
      setSelectedDietary(initialData.attributes?.dietary || []);
      setProductPeso(initialData.attributes?.peso?.[0] || '');
      setProductCacau(initialData.attributes?.cacau?.[0] || '');
      setProductUnidade(initialData.attributes?.unidade?.[0] || '');
      setProductSabor(initialData.attributes?.sabor?.[0] || '');
    } else {
      // Defaults for new product
      setName('');
      setDescription('');
      setImageUrls(['']);
      setIsSeasonal(true);
      setSelectedCategorias([]);
      setSelectedDietary([]);
      setProductPeso('');
      setProductCacau('');
      setProductUnidade('');
      setProductSabor('');
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
      setImageUrls(['']);
    }
  };

  const handleCheckboxChange = (setter: React.Dispatch<React.SetStateAction<string[]>>, option: string) => {
    setter(prev => 
      prev.includes(option) ? prev.filter(item => item !== option) : [...prev, option]
    );
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    if (!name.trim()) {
      toast({ title: "Erro de Validação", description: "Nome do produto é obrigatório.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    
    const finalImageUrls = imageUrls.map(url => url.trim()).filter(url => url !== '');
    if (finalImageUrls.length === 0) {
        finalImageUrls.push('https://placehold.co/400x300.png?text=Produto');
    }

    // Construct attributes object
    const newAttributes: Record<string, string[]> = {};
    if (selectedCategorias.length > 0) newAttributes.categoria = selectedCategorias;
    if (selectedDietary.length > 0) newAttributes.dietary = selectedDietary;
    if (productPeso.trim()) newAttributes.peso = [productPeso.trim()];
    if (productCacau.trim()) newAttributes.cacau = [productCacau.trim()];
    if (productUnidade.trim()) newAttributes.unidade = [productUnidade.trim()];
    if (productSabor.trim()) newAttributes.sabor = [productSabor.trim()];


    try {
      const productData = { 
        name, 
        description,
        imageUrls: finalImageUrls,
        attributes: newAttributes,
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
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto p-1 pr-4">
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
        {imageUrls.filter(url => url.trim())[0] && <img src={imageUrls.filter(url => url.trim())[0]} data-ai-hint="chocolate product" alt="Preview" className="mt-2 h-24 w-24 object-cover rounded-md border"/>}
      </div>

      <Separator />
      <p className="font-semibold text-lg">Atributos do Produto</p>

      <div>
        <Label className="font-semibold">Categorias</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
          {CATEGORIA_OPTIONS.map(option => (
            <div key={option} className="flex items-center space-x-2">
              <Checkbox
                id={`cat-${option}`}
                checked={selectedCategorias.includes(option)}
                onCheckedChange={() => handleCheckboxChange(setSelectedCategorias, option)}
              />
              <Label htmlFor={`cat-${option}`} className="font-normal cursor-pointer">{option}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label className="font-semibold">Dietas e Restrições</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
          {DIETARY_OPTIONS.map(option => (
            <div key={option} className="flex items-center space-x-2">
              <Checkbox
                id={`diet-${option}`}
                checked={selectedDietary.includes(option)}
                onCheckedChange={() => handleCheckboxChange(setSelectedDietary, option)}
              />
              <Label htmlFor={`diet-${option}`} className="font-normal cursor-pointer">{option}</Label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="product-peso" className="font-semibold">Peso do Produto</Label>
          <Input id="product-peso" value={productPeso} onChange={(e) => setProductPeso(e.target.value)} className="mt-1" placeholder="Ex: 100g, 1kg"/>
        </div>
        <div>
          <Label htmlFor="product-cacau" className="font-semibold">Teor de Cacau</Label>
          <Input id="product-cacau" value={productCacau} onChange={(e) => setProductCacau(e.target.value)} className="mt-1" placeholder="Ex: 70%, 45%"/>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div>
          <Label htmlFor="product-unidade" className="font-semibold">Unidade de Venda</Label>
          <Input id="product-unidade" value={productUnidade} onChange={(e) => setProductUnidade(e.target.value)} className="mt-1" placeholder="Ex: barra, tablete, kg"/>
        </div>
        <div>
          <Label htmlFor="product-sabor" className="font-semibold">Sabor Principal (se houver)</Label>
          <Input id="product-sabor" value={productSabor} onChange={(e) => setProductSabor(e.target.value)} className="mt-1" placeholder="Ex: Açaí, Cupuaçu, Caramelo"/>
        </div>
      </div>


      <Separator />
      
      <div className="flex items-center space-x-2 pt-2">
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

