
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { fetchProductAvailabilityInActiveCycle, setProductAvailabilityInActiveCycle } from '@/lib/supabasePlaceholders';
import { supabase } from '@/lib/supabaseClient';

interface ProductFormProps {
  initialData?: Product | null;
  onSubmit: (data: Omit<Product, 'productId' | 'createdAt' | 'updatedAt'> | (Partial<Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>> & { productId: string })) => Promise<Product>;
  onClose: (product?: Product) => void;
}

const CATEGORIA_OPTIONS = ["Barra", "Tablete", "Pastilhas", "Granel", "Gotas", "Recheado"];
const DIETARY_OPTIONS = ["vegano", "sem glúten", "sem lactose", "KOSHER", "ZERO AÇÚCAR"];


export function ProductForm({ initialData, onSubmit, onClose }: ProductFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedCategorias, setSelectedCategorias] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [productPeso, setProductPeso] = useState('');
  const [productCacau, setProductCacau] = useState('');
  const [productUnidade, setProductUnidade] = useState('');
  const [productSabor, setProductSabor] = useState('');
  const [isAvailableInActiveCycle, setIsAvailableInActiveCycle] = useState(true);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description);
      setImageUrl(initialData.imageUrl || '');
      setSelectedImageFile(null);

      setSelectedCategorias(initialData.attributes?.categoria || []);
      setSelectedDietary(initialData.attributes?.dietary || []);
      setProductPeso(initialData.attributes?.peso?.[0] || '');
      setProductCacau(initialData.attributes?.cacau?.[0] || '');
      setProductUnidade(initialData.attributes?.unidade?.[0] || '');
      setProductSabor(initialData.attributes?.sabor?.[0] || '');

      if (initialData.productId) {
        setIsLoadingAvailability(true);
        fetchProductAvailabilityInActiveCycle(initialData.productId)
          .then(isAvailable => {
            setIsAvailableInActiveCycle(isAvailable);
          })
          .catch(err => {
            console.error("Error fetching product availability:", err);
            toast({ title: "Erro de Disponibilidade", description: "Não foi possível carregar a disponibilidade do produto no ciclo ativo.", variant: "destructive" });
          })
          .finally(() => setIsLoadingAvailability(false));
      } else {
        setIsAvailableInActiveCycle(true);
        setIsLoadingAvailability(false);
      }
    } else {
      setName('');
      setDescription('');
      setImageUrl('');
      setSelectedImageFile(null);
      setSelectedCategorias([]);
      setSelectedDietary([]);
      setProductPeso('');
      setProductCacau('');
      setProductUnidade('');
      setProductSabor('');
      setIsAvailableInActiveCycle(true);
      setIsLoadingAvailability(false);
    }
  }, [initialData, toast]);

  const handleCheckboxChange = (setter: React.Dispatch<React.SetStateAction<string[]>>, option: string) => {
    setter(prev =>
      prev.includes(option) ? prev.filter(item => item !== option) : [...prev, option]
    );
  };

  const handleDirectImageUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(event.target.value);
    setSelectedImageFile(null); 
  };

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedImageFile(file);
    if (file) {
        setImageUrl(URL.createObjectURL(file)); 
    } else {
        setImageUrl(initialData?.imageUrl || '');
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    if (!name.trim()) {
       toast({ title: "Erro de Validação", description: "Nome do produto é obrigatório.", variant: "destructive" });
       setIsSubmitting(false);
       return;
    }
    if (!description.trim()) {
       toast({ title: "Erro de Validação", description: "Descrição do produto é obrigatória.", variant: "destructive" });
       setIsSubmitting(false);
       return;
    }

    let finalImageUrlToSave = imageUrl; // Default to current imageUrl (typed or from initialData)

    if (selectedImageFile) {
      setIsUploadingImage(true);
      const filePath = `products/${Date.now()}_${selectedImageFile.name}`;
      const bucketName = 'produtos-nugalli'; // Confirming this is the bucket name

      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, selectedImageFile);

        if (uploadError) {
            if (uploadError.message.includes("Bucket not found")) {
                 toast({ title: "Erro no Upload", description: `Bucket '${bucketName}' não encontrado no Supabase Storage. Verifique o nome e as configurações do bucket.`, variant: "destructive", duration: 10000 });
            } else {
                toast({ title: "Erro no Upload", description: `Falha ao carregar nova imagem: ${uploadError.message}`, variant: "destructive" });
            }
            setIsUploadingImage(false);
            setIsSubmitting(false);
            return;
        }
        
        if (!uploadData || !uploadData.path) {
            toast({ title: "Erro no Upload", description: "Upload bem-sucedido, mas o caminho do arquivo não foi retornado.", variant: "destructive" });
            setIsUploadingImage(false);
            setIsSubmitting(false);
            return;
        }

        const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(uploadData.path);
        finalImageUrlToSave = publicUrlData.publicUrl;
        toast({ title: "Upload Sucesso", description: "Nova imagem carregada." });
      } catch (error: any) {
        console.error("Error uploading image during submit:", error);
        toast({ title: "Erro Crítico no Upload", description: `Falha ao carregar nova imagem: ${error.message}`, variant: "destructive" });
        setIsUploadingImage(false);
        setIsSubmitting(false);
        return;
      }
      setIsUploadingImage(false);
    }
    
    if (!finalImageUrlToSave && !initialData?.imageUrl) { // If it's a new product and no URL/file, or URL was cleared
      finalImageUrlToSave = 'https://placehold.co/400x300.png?text=Produto';
    } else if (!finalImageUrlToSave && initialData?.imageUrl) { // If URL was cleared but was editing
        finalImageUrlToSave = initialData.imageUrl; // Keep original if user cleared input but didn't provide new file
    }


    const productAttributes: Record<string, string[]> = {};
    if (selectedCategorias.length > 0) productAttributes.categoria = selectedCategorias;
    if (selectedDietary.length > 0) productAttributes.dietary = selectedDietary;
    if (productPeso.trim()) productAttributes.peso = [productPeso.trim()];
    if (productCacau.trim()) productAttributes.cacau = [productCacau.trim()];
    if (productUnidade.trim()) productAttributes.unidade = [productUnidade.trim()];
    if (productSabor.trim()) productAttributes.sabor = [productSabor.trim()];

    const productDataPayload = {
      name,
      description,
      imageUrl: finalImageUrlToSave,
      attributes: productAttributes
    };

    try {
      let savedProduct: Product;
      if (initialData?.productId) {
        savedProduct = await onSubmit({ ...productDataPayload, productId: initialData.productId });
      } else {
        savedProduct = await onSubmit(productDataPayload as Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>);
      }

      if (savedProduct && savedProduct.productId) {
        await setProductAvailabilityInActiveCycle(savedProduct.productId, isAvailableInActiveCycle);
        toast({ title: "Disponibilidade Atualizada", description: `Disponibilidade de "${savedProduct.name}" no ciclo ativo foi salva.` });
      } else {
         console.warn("Product was not saved or ID is missing, skipping availability update.");
      }

      onClose(savedProduct);
    } catch (error: any) {
      console.error("Error in ProductForm handleSubmit (after calling onSubmit or during availability update):", error);
      // The parent onSubmit should handle its own errors related to DB save of product
      // This toast is a fallback or for availability update errors
      if (!String(error.message).toLowerCase().includes("produto") && !String(error.message).toLowerCase().includes("image_url")) {
         toast({ title: "Erro ao Finalizar", description: `Ocorreu um problema ao salvar os dados completos: ${error.message || 'Erro desconhecido.'}`, variant: "destructive" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto p-1 pr-4">
      <div>
        <Label htmlFor="product-name" className="font-semibold">Nome do Produto</Label>
        <Input id="product-name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1" />
      </div>

      <div>
        <Label htmlFor="product-description" className="font-semibold">Descrição Detalhada</Label>
        <Textarea id="product-description" value={description} onChange={(e) => setDescription(e.target.value)} required className="mt-1" rows={4} />
      </div>

      <div>
        <Label htmlFor="product-image-url-input" className="font-semibold">URL da Imagem</Label>
        <Input
          id="product-image-url-input"
          type="text"
          value={imageUrl}
          onChange={handleDirectImageUrlChange}
          placeholder="https://exemplo.com/imagem.png ou carregue abaixo"
          className="mt-1"
        />
        {imageUrl && !selectedImageFile ? ( // Show URL preview only if no file is selected
          <div className="mt-2 w-32 h-32 relative border rounded-md overflow-hidden">
            <img src={imageUrl} alt="Preview do Produto (URL)" className="object-cover w-full h-full" data-ai-hint="chocolate item"/>
          </div>
        ) : selectedImageFile && imageUrl.startsWith('blob:') ? ( // Show blob preview if a file is selected
           <div className="mt-2 w-32 h-32 relative border rounded-md overflow-hidden">
            <img src={imageUrl} alt="Preview do Produto (Upload)" className="object-cover w-full h-full" data-ai-hint="chocolate item"/>
          </div>
        ) : null}
      </div>

      <div>
         <Label htmlFor="imageUpload" className="font-semibold">Carregar Nova Imagem (substitui URL acima)</Label>
         <div className="flex items-center space-x-2 mt-1">
           <Input id="imageUpload" type="file" accept="image/*" onChange={handleImageFileChange} disabled={isUploadingImage || isSubmitting} className="flex-grow"/>
         </div>
         {selectedImageFile && <p className="text-xs text-muted-foreground mt-1">Nova imagem selecionada: {selectedImageFile.name}. Será carregada ao salvar.</p>}
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
          <Label htmlFor="product-cacau" className="font-semibold">Teor de Cacau (se aplicável)</Label>
          <Input id="product-cacau" value={productCacau} onChange={(e) => setProductCacau(e.target.value)} className="mt-1" placeholder="Ex: 70%, 50%"/>
        </div>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="product-sabor" className="font-semibold">Sabor Principal (se houver)</Label>
            <Input id="product-sabor" value={productSabor} onChange={(e) => setProductSabor(e.target.value)} className="mt-1" placeholder="Ex: Açaí, Cupuaçu, Caramelo"/>
          </div>
           <div>
            <Label htmlFor="product-unidade" className="font-semibold">Unidade de Venda</Label>
            <Input id="product-unidade" value={productUnidade} onChange={(e) => setProductUnidade(e.target.value)} className="mt-1" placeholder="Ex: unidade, kg, caixa"/>
          </div>
        </div>

        <Separator />
        <p className="font-semibold text-lg">Disponibilidade para Venda</p>

        <div className="flex items-center space-x-2 pt-2">
          <Checkbox
            id="is-available-in-active-cycle"
            checked={isAvailableInActiveCycle}
            onCheckedChange={(checked) => setIsAvailableInActiveCycle(Boolean(checked))}
            disabled={isLoadingAvailability || isSubmitting || !initialData?.productId}
          />
          <Label htmlFor="is-available-in-active-cycle" className="font-semibold">Disponível no ciclo de compra ativo?</Label>
          {isLoadingAvailability && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
        </div>
        <p className="text-xs text-muted-foreground">Controla se este produto aparece para os clientes no ciclo de vendas ativo no site. {!initialData?.productId && "Para novos produtos, esta opção é aplicada após a criação bem-sucedida do produto."}</p>

        <div className="flex justify-end space-x-3 pt-4 border-t sticky bottom-0 bg-card py-3">
        <Button type="button" variant="outline" onClick={() => onClose()} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting || isLoadingAvailability || isUploadingImage}>
          {isSubmitting || isUploadingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isSubmitting ? (initialData ? 'Salvando...' : 'Criando...') : (initialData ? 'Salvar Alterações' : 'Criar Produto')}
        </Button>
      </div>
    </form>
  );
}

    