
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
import { supabase } from '@/lib/supabaseClient';

interface ProductFormProps {
  initialData?: Product | null;
  onSubmit: (data: Omit<Product, 'productId' | 'createdAt' | 'updatedAt'> | (Partial<Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>> & { productId: string })) => Promise<Product>; // Ensure onSubmit returns the product
  onClose: (product?: Product) => void;
}

const CATEGORIA_OPTIONS = ["Barra", "Tablete", "Pastilhas", "Granel", "Gotas", "Recheado"];
const DIETARY_OPTIONS = ["vegano", "sem glúten", "sem lactose", "KOSHER", "ZERO AÇÚCAR"];


export function ProductForm({ initialData, onSubmit, onClose }: ProductFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // New state for specific attributes
  const [selectedCategorias, setSelectedCategorias] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [productPeso, setProductPeso] = useState('');
  const [productCacau, setProductCacau] = useState('');
  const [productUnidade, setProductUnidade] = useState('');
  const [productSabor, setProductSabor] = useState('');

  const [isAvailableInActiveCycle, setIsAvailableInActiveCycle] = useState(true);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description);
      setImageUrl(initialData.imageUrl || '');

      setSelectedCategorias(initialData.attributes?.categoria || []);
      setSelectedDietary(initialData.attributes?.dietary || []);
      setProductPeso(initialData.attributes?.peso?.[0] || '');
      setProductCacau(initialData.attributes?.cacau?.[0] || ''); // Assuming 'cacau' attribute might exist
      setProductUnidade(initialData.attributes?.unidade?.[0] || '');
      setProductSabor(initialData.attributes?.sabor?.[0] || '');

      // Fetch availability only if it's an existing product
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
      setImageUrl('');
      setSelectedCategorias([]);
      setSelectedDietary([]);
      setProductPeso('');
      setProductCacau('');
      setProductUnidade('');
      setProductSabor('');
      setIsAvailableInActiveCycle(true); // New products are available by default
    }
  }, [initialData, toast]); // Added dependencies

  const handleCheckboxChange = (setter: React.Dispatch<React.SetStateAction<string[]>>, option: string) => {
    setter(prev => 
      prev.includes(option) ? prev.filter(item => item !== option) : [...prev, option]
    );
  };

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedImage(file);
  };

  const handleImageUpload = async () => {
    if (!selectedImage) return;

    setIsUploadingImage(true);

    const filePath = `products/${Date.now()}_${selectedImage.name}`; // Store in products directory
    const bucketName = 'product-images'; 

    try {
      const { data, error } = await supabase.storage // Corrected Supabase call
 .from('product-images') // Use the actual bucket name string
        .upload(filePath, selectedImage);

      if (error) {
 // If the error is specifically about an existing file, try to overwrite (optional, depending on desired behavior)
        throw error;
      }

      // Use the data.path returned from the upload which is the full path within the bucket
      const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(data.path);
      setImageUrl(publicUrlData.publicUrl); // Set the single image URL
      toast({ title: "Upload Sucesso", description: "Imagem carregada com sucesso." });
    } catch (error: any) {
 toast({ title: "Erro no Upload", description: `Não foi possível carregar a imagem: ${(error as Error).message}`, variant: "destructive" });
    } finally {
      setIsUploadingImage(false);
      setSelectedImage(null); 
      const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
      if (fileInput) fileInput.value = ''; 
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    if (!name.trim() || !description.trim() || !imageUrl.trim()) {
       toast({ title: "Erro", description: "Nome do produto é obrigatório.", variant: "destructive" });
       setIsSubmitting(false);
       return;
    }

    // If a new image is selected, upload it first
    let newImageUrl = imageUrl; // Start with the current imageUrl state

    if (selectedImage) {
      const filePath = `products/${Date.now()}_${selectedImage.name}`;
      const bucketName = 'product-images'; // Your actual bucket name

      try {
 const { data, error: uploadError } = await supabase.storage // Ensure supabase client is imported
          .from(bucketName) // Use the actual bucket name string
          .upload(filePath, selectedImage);

        if (uploadError) {
          throw uploadError;
        }

 const { data: publicUrlData, error: publicUrlError } = supabase.storage.from(bucketName).getPublicUrl(data.path);
        if (publicUrlError) {
          throw publicUrlError;
        }
        newImageUrl = publicUrlData.publicUrl; // Use the new URL
        // Optionally toast about successful upload here, but the main save toast comes later
      } catch (error: any) {
        console.error("Error uploading image:", error);
 toast({ title: "Erro no Upload", description: `Não foi possível carregar a imagem: ${(error as Error).message}`, variant: "destructive" });
        setIsSubmitting(false); // Stop submission if image upload fails
        setSelectedImage(null);
        return; // Stop the submission process
      }
    }

    // Use the uploaded image URL if available, otherwise use the existing one or a placeholder
    const finalImageUrl = newImageUrl || imageUrl || 'https://placehold.co/400x300.png?text=Produto'; // Ensure placeholder is a single string

    const newAttributes: Record<string, string[]> = {};
    if (selectedCategorias.length > 0) newAttributes.categoria = selectedCategorias;
    if (selectedDietary.length > 0) newAttributes.dietary = selectedDietary;
    if (productPeso.trim()) newAttributes.peso = [productPeso.trim()];
    if (productCacau.trim()) newAttributes.cacau = [productCacau.trim()]; // Include cacau
    if (productUnidade.trim()) newAttributes.unidade = [productUnidade.trim()];
    if (productSabor.trim()) newAttributes.sabor = [productSabor.trim()];

    try {
      const productMasterData = { 
        name, 
        description,
 imageUrl: finalImageUrl, // Use the single final image URL
        attributes: newAttributes // Include updated attributes
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

      await setProductAvailabilityInActiveCycle(currentProductId, isAvailableInActiveCycle);
      toast({ title: "Disponibilidade Atualizada", description: `Disponibilidade de "${name}" no ciclo ativo foi salva.` });
      
      onClose(initialData ? { ...initialData, ...productMasterData, productId: currentProductId, updatedAt: new Date().toISOString() } as Product : { ...productMasterData, productId: currentProductId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Product);
 } catch (error: any) {
      console.error("Failed to save product or availability:", error);
 toast({ title: "Erro ao Salvar", description: `Não foi possível salvar o produto ou sua disponibilidade: ${(error as Error).message}`, variant: "destructive" });
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
        <Label htmlFor="product-image-url" className="font-semibold">URL da Imagem</Label>
        <Input 
          id="product-image-url" 
          type="url"
          value={imageUrl} 
          onChange={(e) => setImageUrl(e.target.value)} 
          placeholder="https://exemplo.com/imagem.png"         />
        {(imageUrl || selectedImage) && ( // Display image if URL exists or a file is selected
          <div className="mt-2 w-32 h-32 relative border rounded-md overflow-hidden">
            {/* Use object-cover for consistent image display */}
            <img src={selectedImage ? URL.createObjectURL(selectedImage) : imageUrl} alt="Product Image" className="object-cover w-full h-full" />
          </div>
        )}
      </div>

      <div>
         <Label className="font-semibold">Carregar Imagem do Computador</Label>
         <div className="flex items-center space-x-2 mt-1">
           <Input id="imageUpload" type="file" accept="image/*" onChange={handleImageFileChange} disabled={isUploadingImage} className="flex-grow"/>
           <Button onClick={handleImageUpload} disabled={!selectedImage || isUploadingImage || isSubmitting} type="button">
              {isUploadingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
             {isUploadingImage ? 'Carregando...' : 'Carregar Imagem'}
           </Button>
         </div>
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
          <Label htmlFor="product-cacau" className="font-semibold">Teor de Cacau (se aplicável)</Label>
          <Input id="product-cacau" value={productCacau} onChange={(e) => setProductCacau(e.target.value)} className="mt-1" placeholder="Ex: 70%, 50%"/>
        </div>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="product-sabor" className="font-semibold">Sabor Principal (se houver)</Label>
            <Input id="product-sabor" value={productSabor} onChange={(e) => setProductSabor(e.target.value)} className="mt-1" placeholder="Ex: Açaí, Cupuaçu, Caramelo"/>
          </div>
        </div>

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
        <Button type="submit" disabled={isSubmitting || isLoadingAvailability || isUploadingImage}>
          {isSubmitting ? (initialData ? 'Salvando...' : 'Criando...') : (initialData ? 'Salvar Alterações' : 'Criar Produto Mestre')}
        </Button>
      </div>
    </form>
  )};

