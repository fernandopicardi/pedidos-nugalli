
"use client";

import { useState } from 'react';
import Image from 'next/image';
import type { DisplayableProduct } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ShoppingCart, PlusCircle, MinusCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { addToCart } from '@/lib/supabasePlaceholders'; // Assuming addToCart is used

interface ProductCardProps {
  product: DisplayableProduct;
}

// Helper function to format attributes for display
const formatAttributes = (attributes: Record<string, string[]>): string => {
  const allAttributes: string[] = [];
  for (const key in attributes) {
    // Exclude specific keys that might be displayed differently or are part of the main description/title.
    if (!["unidade", "categoria", "peso", "cacau", "sabor", "unidades"].includes(key.toLowerCase())) {
      attributes[key].forEach(value => allAttributes.push(value));
    }
  }
  return allAttributes.join(', ');
};

const MAX_SHORT_DESC_LENGTH = 80;

export function ProductCard({ product }: ProductCardProps) {
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 0 && newQuantity <= 10) { // Max 10 items per product type via UI
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
  const complementaryAttributesDisplay = formatAttributes(product.attributes); // Renamed for clarity

  const toggleDescription = () => {
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

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
      <CardContent className="p-4 flex-grow flex flex-col">
        <div className="flex-grow"> {/* This div will allow content to push quantity selector down */}
          <CardTitle className="font-headline text-xl mb-1 line-clamp-2 h-[3em]">{product.name}</CardTitle>
          
          {/* Expandable Product Description */}
          {product.description && (
            <div className="text-sm text-muted-foreground mb-2 min-h-[3.5em]" aria-live="polite">
              {isDescriptionExpanded || product.description.length <= MAX_SHORT_DESC_LENGTH ? (
                <>
                  {product.description}
                  {product.description.length > MAX_SHORT_DESC_LENGTH && (
                    <button
                      onClick={toggleDescription}
                      aria-expanded="true"
                      className="text-primary hover:underline focus:underline focus:outline-none ml-1 font-medium"
                    >
                      Ver menos
                    </button>
                  )}
                </>
              ) : (
                <>
                  {`${product.description.substring(0, MAX_SHORT_DESC_LENGTH)}...`}
                  <button
                    onClick={toggleDescription}
                    aria-expanded="false"
                    className="text-primary hover:underline focus:underline focus:outline-none ml-1 font-medium"
                  >
                    Ver mais
                  </button>
                </>
              )}
            </div>
          )}

          {complementaryAttributesDisplay && (
            <p className="text-xs text-muted-foreground mb-2 min-h-[1.5em] line-clamp-2">
              {complementaryAttributesDisplay}
            </p>
          )}
          
          <p className="text-2xl font-semibold text-primary mb-3">
            R$ {product.price.toFixed(2).replace('.', ',')}
            {unitOfSale.toLowerCase() !== 'unidade' && <span className="text-sm font-normal text-muted-foreground"> / {unitOfSale}</span>}
          </p>
        </div>
        
        <div className="mt-auto pt-3"> {/* mt-auto pushes this block to the bottom, pt-3 for spacing */}
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
              max="10" // Consistent with handleQuantityChange
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
