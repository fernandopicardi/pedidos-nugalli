
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
import { Loader2 } from 'lucide-react';
import { fetchProductAvailabilityInActiveCycle, setProductAvailabilityInActiveCycle } from '@/lib/supabasePlaceholders';

interface ProductFormProps {
  initialData?: Product | null;
  onSubmit: (data: Omit<Product, 'productId' | 'createdAt' | 'updatedAt'> | (Partial<Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>> & { productId: string })) => Promise<{productId: string} | Product>; // Ensure onSubmit returns the product or its ID
  onClose: () => void;
}

const CATEGORIA_OPTIONS = ["Barra", "Tablete", "Pastilhas", "Granel", "Gotas", "Recheado"];
const DIETARY_OPTIONS = ["vegano", "sem glúten", "sem lactose", "KOSHER", "ZERO AÇÚCAR"];


export function ProductForm({ initialData, onSubmit, onClose }: ProductFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [masterIsSeasonalFlag, setMasterIsSeasonalFlag] = useState(true); // For the master product's own seasonal flag

  // New state for specific attributes
  const [selectedCategorias, setSelectedCategorias] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [productPeso, setProductPeso] = useState('');
  const [productCacau, setProductCacau] = useState('');
  const [productUnidade, setProductUnidade] = useState('');
  const [productSabor, setProductSabor] = useState('');

  const [isAvailableInActiveCycle, setIsAvailableInActiveCycle] = useState(true);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description);
      setImageUrls(initialData.imageUrls && initialData.imageUrls.length > 0 ? initialData.imageUrls : ['']);
      setMasterIsSeasonalFlag(initialData.isSeasonal); // Keep track of the master product's seasonal flag

      setSelectedCategorias(initialData.attributes?.categoria || []);
      setSelectedDietary(initialData.attributes?.dietary || []);
      setProductPeso(initialData.attributes?.peso?.[0] || '');
      setProductCacau(initialData.attributes?.cacau?.[0] || '');
      setProductUnidade(initialData.attributes?.unidade?.[0] || '');
      setProductSabor(initialData.attributes?.sabor?.[0] || '');

      setIsLoadingAvailability(true);
      fetchProductAvailabilityInActiveCycle(initialData.productId)
        .then(isAvailable => {
          setIsAvailableInActiveCycle(isAvailable);
        })
        .catch(err => {
          console.error("Error fetching product availability:", err);
          toast({ title: "Erro", description: "Não foi possível carregar a disponibilidade no ciclo ativo.", variant: "destructive" });
        })
        .finally(() => setIsLoadingAvailability(false));

    } else {
      // Defaults for new product
      setName('');
      setDescription('');
      setImageUrls(['']);
      setMasterIsSeasonalFlag(true);
      setSelectedCategorias([]);
      setSelectedDietary([]);
      setProductPeso('');
      setProductCacau('');
      setProductUnidade('');
      setProductSabor('');
      setIsAvailableInActiveCycle(true); // Default to available for new products
      setIsLoadingAvailability(false);
    }
  }, [initialData, toast]);

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

    const newAttributes: Record<string, string[]> = {};
    if (selectedCategorias.length > 0) newAttributes.categoria = selectedCategorias;
    if (selectedDietary.length > 0) newAttributes.dietary = selectedDietary;
    if (productPeso.trim()) newAttributes.peso = [productPeso.trim()];
    if (productCacau.trim()) newAttributes.cacau = [productCacau.trim()];
    if (productUnidade.trim()) newAttributes.unidade = [productUnidade.trim()];
    if (productSabor.trim()) newAttributes.sabor = [productSabor.trim()];

    try {
      const productMasterData = { 
        name, 
        description,
        imageUrls: finalImageUrls,
        attributes: newAttributes,
        isSeasonal: masterIsSeasonalFlag, // Submit the original seasonal flag for the master product
      };

      let currentProductId: string;

      if (initialData?.productId) {
        currentProductId = initialData.productId;
        await onSubmit({ ...productMasterData, productId: currentProductId });
        toast({ title: "Produto Mestre Atualizado", description: `O produto "${name}" foi atualizado.` });
      } else {
        const newProduct = await onSubmit(productMasterData as Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>);
        currentProductId = newProduct.productId;
        toast({ title: "Produto Mestre Criado", description: `O produto "${name}" foi criado.` });
      }

      // After saving master product, update its availability in the active cycle
      await setProductAvailabilityInActiveCycle(currentProductId, isAvailableInActiveCycle);
      toast({ title: "Disponibilidade Atualizada", description: `Disponibilidade de "${name}" no ciclo ativo foi salva.` });
      
      onClose();
    } catch (error) {
      console.error("Failed to save product or availability:", error);
      toast({ title: "Erro ao Salvar", description: "Não foi possível salvar o produto ou sua disponibilidade.", variant: "destructive" });
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
      <p className="font-semibold text-lg">Atributos do Produto Mestre</p>

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
      
      <div className="flex items-center space-x-2 pt-2">
        <Checkbox
          id="master-is-seasonal"
          checked={masterIsSeasonalFlag}
          onCheckedChange={(checked) => setMasterIsSeasonalFlag(Boolean(checked))}
        />
        <Label htmlFor="master-is-seasonal" className="font-semibold">Este é um produto mestre primariamente sazonal?</Label>
      </div>
      <p className="text-xs text-muted-foreground">Esta marcação é para organização interna do catálogo mestre.</p>


      <Separator />
      <p className="font-semibold text-lg">Disponibilidade para Venda</p>
      
      <div className="flex items-center space-x-2 pt-2">
        <Checkbox
          id="is-available-in-active-cycle"
          checked={isAvailableInActiveCycle}
          onCheckedChange={(checked) => setIsAvailableInActiveCycle(Boolean(checked))}
          disabled={isLoadingAvailability}
        />
        <Label htmlFor="is-available-in-active-cycle" className="font-semibold">Disponível no ciclo de compra ativo?</Label>
        {isLoadingAvailability && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
      </div>
      <p className="text-xs text-muted-foreground">Controla se este produto aparece para os clientes no ciclo de vendas ativo no site.</p>
      
      <div className="flex justify-end space-x-3 pt-4 border-t sticky bottom-0 bg-card py-3">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || isLoadingAvailability}>
          {isSubmitting ? (initialData ? 'Salvando...' : 'Criando...') : (initialData ? 'Salvar Alterações' : 'Criar Produto Mestre')}
        </Button>
      </div>
    </form>
  );
}

