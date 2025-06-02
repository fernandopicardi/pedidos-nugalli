
import { ProductGrid } from '@/components/products/product-grid';
import { PageContainer } from '@/components/shared/page-container';
import { fetchActivePurchaseCycleProducts, fetchActivePurchaseCycleTitle } from '@/lib/supabasePlaceholders';
import type { Product } from '@/types'; // Product here is Master Product

export default async function HomePage() {
  // This fetches master products. Price and availability for the cycle
  // will eventually come from CycleProduct integration.
  const products: Product[] = await fetchActivePurchaseCycleProducts();
  const cycleTitle: string = await fetchActivePurchaseCycleTitle();

  // Temporary: ProductCard expects `price`. Master Product doesn't have it.
  // This is a placeholder until CycleProduct is integrated into ProductGrid/Card.
  const productsWithPrice = products.map(p => ({
    ...p,
    price: p.attributes?.defaultPrice ? parseFloat(p.attributes.defaultPrice[0]) : Math.random() * 100 + 50, // Placeholder price
    imageUrl: p.imageUrls[0] || 'https://placehold.co/400x300.png?text=Nugali' // Placeholder image
  }));


  return (
    <PageContainer>
      <section className="text-center my-8 md:my-12">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-4">
          {cycleTitle}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Descubra nossa seleção exclusiva de chocolates artesanais, preparados com os melhores ingredientes para este ciclo de compra.
        </p>
      </section>
      <ProductGrid products={productsWithPrice} />
    </PageContainer>
  );
}
