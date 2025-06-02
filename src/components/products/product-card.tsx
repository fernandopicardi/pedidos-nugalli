"use client";

import Image from 'next/image';
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { addToCart } from '@/lib/supabasePlaceholders';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { toast } = useToast();

  const handleAddToCart = async () => {
    // TODO: Implement Supabase add to cart logic
    console.log('Adding to cart:', product.name);
    await addToCart(product, 1); // Assuming quantity 1 for now
    toast({
      title: `${product.name} adicionado!`,
      description: "Continue comprando ou finalize seu pedido.",
    });
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
      <CardContent className="p-4 flex-grow">
        <CardTitle className="font-headline text-xl mb-1">{product.name}</CardTitle>
        {product.description && (
          <CardDescription className="text-sm text-muted-foreground mb-2 min-h-[3em] line-clamp-2">
            {product.description}
          </CardDescription>
        )}
        <p className="text-2xl font-semibold text-primary">
          R$ {product.price.toFixed(2).replace('.', ',')}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button onClick={handleAddToCart} className="w-full">
          <ShoppingCart size={18} className="mr-2" />
          Adicionar ao Pedido
        </Button>
      </CardFooter>
    </Card>
  );
}
