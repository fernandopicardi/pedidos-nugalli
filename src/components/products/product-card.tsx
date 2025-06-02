
"use client";

import { useState } from 'react';
import Image from 'next/image';
import type { DisplayableProduct } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ShoppingCart, PlusCircle, MinusCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { addToCart } from '@/lib/supabasePlaceholders';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: DisplayableProduct;
}

// Helper function to format attributes for display
const formatAttributes = (attributes: Record<string, string[]>): string => {
  const allAttributes: string[] = [];
  for (const key in attributes) {
    if (key.toLowerCase() !== 'unidade' && key.toLowerCase() !== 'categoria' && key.toLowerCase() !== 'peso' && key.toLowerCase() !== 'cacau' && key.toLowerCase() !== 'sabor' && key.toLowerCase() !== 'unidades') { // Exclude specific keys from general list
      attributes[key].forEach(value => allAttributes.push(value));
    }
  }
  return allAttributes.join(', ');
};

export function ProductCard({ product }: ProductCardProps) {
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(0);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 0 && newQuantity <= 10) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    if (quantity === 0) {
      toast({
        title: "Quantidade inválida",
        description: "Por favor, selecione uma quantidade maior que zero.",
        variant: "destructive",
      });
      return;
    }
    await addToCart(product, quantity);
    toast({
      title: `${product.name} adicionado!`,
      description: `${quantity} unidade(s) adicionada(s) ao seu pedido.`,
    });
    setQuantity(0); // Reset quantity after adding
  };

  const unitOfSale = product.attributes?.unidade?.[0] || 'unidade';
  const complementaryDescription = formatAttributes(product.attributes);

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
      <CardHeader className="p-0">
        <div className="aspect-square w-full relative">
          <Image
            src={product.imageUrl}
            alt={product.name}
            layout="fill"
            objectFit="cover"
            data-ai-hint="chocolate product"
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow flex flex-col justify-between">
        <div>
          <CardTitle className="font-headline text-xl mb-1 line-clamp-2">{product.name}</CardTitle>
          {complementaryDescription && (
            <p className="text-xs text-muted-foreground mb-2 min-h-[1.5em] line-clamp-2">
              {complementaryDescription}
            </p>
          )}
          <p className="text-2xl font-semibold text-primary mb-2">
            R$ {product.price.toFixed(2).replace('.', ',')}
            {unitOfSale !== 'unidade' && <span className="text-sm font-normal text-muted-foreground"> / {unitOfSale}</span>}
          </p>
        </div>
        
        <div className="mt-auto"> {/* Pushes quantity selector and button to the bottom if content above is short */}
          <div className="flex items-center justify-center space-x-2 mb-3">
            <Button variant="outline" size="icon" onClick={() => handleQuantityChange(quantity - 1)} disabled={quantity === 0}>
              <MinusCircle size={18} />
            </Button>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value, 10) || 0)}
              className="w-16 h-10 text-center font-bold"
              min="0"
              max="10"
            />
            <Button variant="outline" size="icon" onClick={() => handleQuantityChange(quantity + 1)} disabled={quantity === 10}>
              <PlusCircle size={18} />
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button onClick={handleAddToCart} className="w-full" disabled={quantity === 0}>
          <ShoppingCart size={18} className="mr-2" />
          Adicionar ao Pedido
        </Button>
      </CardFooter>
    </Card>
  );
}
