import { ProductGrid } from '@/components/products/product-grid';
import { PageContainer } from '@/components/shared/page-container';
import { fetchActiveSeasonProducts, fetchActiveSeasonTitle } from '@/lib/supabasePlaceholders';
import type { Product } from '@/types';

export default async function HomePage() {
  // Placeholder for fetching products. Replace with actual Supabase call.
  const products: Product[] = await fetchActiveSeasonProducts();
  const seasonTitle: string = await fetchActiveSeasonTitle();

  return (
    <PageContainer>
      <section className="text-center my-8 md:my-12">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-4">
          {seasonTitle}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Descubra nossa seleção exclusiva de chocolates artesanais, preparados com os melhores ingredientes para esta temporada.
        </p>
      </section>
      <ProductGrid products={products} />
    </PageContainer>
  );
}
