
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { DisplayableProduct } from '@/types';
import { ProductGrid } from '@/components/products/product-grid';
import { PageContainer } from '@/components/shared/page-container';
import { fetchActivePurchaseCycleProducts, fetchActivePurchaseCycleTitle } from '@/lib/supabasePlaceholders';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, ListFilter, X } from 'lucide-react';

export default function HomePage() {
  const [allProducts, setAllProducts] = useState<DisplayableProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<DisplayableProduct[]>([]);
  const [cycleTitle, setCycleTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<string>('name-asc');

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [productsData, titleData] = await Promise.all([
          fetchActivePurchaseCycleProducts(),
          fetchActivePurchaseCycleTitle()
        ]);
        setAllProducts(productsData);
        setFilteredProducts(productsData); // Initialize with all products
        setCycleTitle(titleData);
      } catch (error) {
        console.error("Failed to load homepage data:", error);
        // Handle error display if necessary
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    allProducts.forEach(p => {
      if (p.attributes?.categoria) {
        p.attributes.categoria.forEach(c => cats.add(c));
      }
    });
    return Array.from(cats).sort();
  }, [allProducts]);

  const nutritionalAttributes = useMemo(() => {
    const attrs = new Set<string>();
    allProducts.forEach(p => {
      // Assuming nutritional attributes might be under a key like 'dietary' or 'nutricional'
      const relevantKeys = ['dietary', 'nutricional', 'sem']; // Add more relevant keys if needed
      relevantKeys.forEach(attrKey => {
        if (p.attributes?.[attrKey]) {
          p.attributes[attrKey].forEach(val => attrs.add(val));
        }
      });
    });
    return Array.from(attrs).sort();
  }, [allProducts]);

  useEffect(() => {
    let products = [...allProducts];

    // Filter by search term
    if (searchTerm) {
      products = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      products = products.filter(p =>
        p.attributes?.categoria?.includes(selectedCategory)
      );
    }

    // Filter by nutritional attributes
    if (selectedAttributes.length > 0) {
      products = products.filter(p =>
        selectedAttributes.every(attr =>
          Object.values(p.attributes).flat().includes(attr)
        )
      );
    }

    // Sort products
    products.sort((a, b) => {
      switch (sortOrder) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'name-asc':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredProducts(products);
  }, [searchTerm, selectedCategory, selectedAttributes, sortOrder, allProducts]);

  const handleAttributeChange = (attribute: string) => {
    setSelectedAttributes(prev =>
      prev.includes(attribute)
        ? prev.filter(a => a !== attribute)
        : [...prev, attribute]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedAttributes([]);
    setSortOrder('name-asc');
  };
  
  const hasActiveFilters = searchTerm || selectedCategory !== 'all' || selectedAttributes.length > 0;


  if (isLoading) {
    return (
      <PageContainer className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando delícias...</p>
      </PageContainer>
    );
  }

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

      <div className="mb-8 p-4 md:p-6 bg-card rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <Label htmlFor="search-term" className="text-sm font-medium">Buscar por Nome</Label>
            <Input
              id="search-term"
              type="text"
              placeholder="Nome do produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="category-select" className="text-sm font-medium">Categoria</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger id="category-select" className="mt-1">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="sort-order" className="text-sm font-medium">Ordenar por</Label>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger id="sort-order" className="mt-1">
                <SelectValue placeholder="Ordenar por..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
                <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
                <SelectItem value="price-asc">Preço (Menor)</SelectItem>
                <SelectItem value="price-desc">Preço (Maior)</SelectItem>
              </SelectContent>
            </Select>
          </div>
           {hasActiveFilters && (
            <div className="md:col-start-4 flex justify-end">
              <Button variant="ghost" onClick={clearFilters} className="text-sm">
                <X size={16} className="mr-1" />
                Limpar Filtros
              </Button>
            </div>
          )}
        </div>
        {nutritionalAttributes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <Label className="text-sm font-medium mb-2 block">Filtros Adicionais</Label>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {nutritionalAttributes.map(attr => (
                <div key={attr} className="flex items-center space-x-2">
                  <Checkbox
                    id={`attr-${attr}`}
                    checked={selectedAttributes.includes(attr)}
                    onCheckedChange={() => handleAttributeChange(attr)}
                  />
                  <Label htmlFor={`attr-${attr}`} className="text-sm font-normal cursor-pointer">
                    {attr}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {filteredProducts.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <ListFilter size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-xl text-muted-foreground">Nenhum produto encontrado com os filtros selecionados.</p>
          <Button onClick={clearFilters} variant="link" className="mt-2">Limpar filtros</Button>
        </div>
      )}

      <ProductGrid products={filteredProducts} />
    </PageContainer>
  );
}
