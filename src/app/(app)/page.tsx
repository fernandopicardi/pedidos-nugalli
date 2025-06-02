
import { ProductGrid } from '@/components/products/product-grid';
import { PageContainer } from '@/components/shared/page-container';
import { fetchActivePurchaseCycleProducts, fetchActivePurchaseCycleTitle } from '@/lib/supabasePlaceholders';
import type { DisplayableProduct } from '@/types'; // Updated to use DisplayableProduct

export default async function HomePage() {
  // fetchActivePurchaseCycleProducts now returns DisplayableProduct[]
  const products: DisplayableProduct[] = await fetchActivePurchaseCycleProducts();
  const cycleTitle: string = await fetchActivePurchaseCycleTitle();

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
      <ProductGrid products={products} /> {/* Pass DisplayableProduct[] directly */}
    </PageContainer>
  );
}
