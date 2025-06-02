
import type { DisplayableProduct } from '@/types'; // Updated to use DisplayableProduct
import { ProductCard } from './product-card';

interface ProductGridProps {
  products: DisplayableProduct[]; // Updated prop type
}

export function ProductGrid({ products }: ProductGridProps) {
  if (!products || products.length === 0) {
    return <p className="text-center text-muted-foreground py-12">Nenhum produto encontrado para este ciclo de compra.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
      {products.map((product) => (
        <ProductCard key={product.cycleProductId} product={product} /> // Use cycleProductId as key
      ))}
    </div>
  );
}
