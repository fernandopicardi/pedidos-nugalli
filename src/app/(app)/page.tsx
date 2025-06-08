
"use client";

import { useState, useEffect, useMemo } from 'react';
import type { DisplayableProduct } from '@/types';
import { ProductGrid } from '@/components/products/product-grid';
import { PageContainer } from '@/components/shared/page-container';
import { supabase } from '@/lib/supabaseClient';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button, buttonVariants } from '@/components/ui/button';
import { Loader2, ListFilter, X, Filter, PackageSearch } from 'lucide-react'; // Added PackageSearch
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const DIETARY_ATTRIBUTE_KEY = "dietary";
const CATEGORY_ATTRIBUTE_KEY = "categoria";
const CACAO_ATTRIBUTE_KEY = "cacau";
const WEIGHT_ATTRIBUTE_KEY = "peso";

export default function HomePage() {
  const [allProducts, setAllProducts] = useState<DisplayableProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<DisplayableProduct[]>([]);
  const [cycleTitle, setCycleTitle] = useState<string>('');
  const [cycleDescription, setCycleDescription] = useState<string | null>(null); 
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCacao, setSelectedCacao] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedWeights, setSelectedWeights] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortOrder, setSortOrder] = useState<string>('name-asc');

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const { data: cycleData, error: cycleError } = await supabase
          .from('purchase_cycles')
          .select('cycle_id, name, description') 
          .eq('is_active', true)
          .maybeSingle();

        if (cycleError) {
          console.error("Error fetching active purchase cycle:", cycleError);
          setCycleTitle("Erro ao carregar ciclo de compra");
          setCycleDescription(null);
          setAllProducts([]);
          setFilteredProducts([]);
          setIsLoading(false);
          return;
        }

        if (!cycleData) {
          setCycleTitle("Nenhum Ciclo de Compra Ativo");
          setCycleDescription(null);
          setAllProducts([]);
          setFilteredProducts([]);
          setIsLoading(false);
          return;
        }

        setCycleTitle(cycleData.name);
        setCycleDescription(cycleData.description || null); 

        const { data: productsData, error: productsError } = await supabase
          .from('cycle_products')
          .select(`
            cycle_product_id, 
            cycle_id, 
            product_id, 
            product_name_snapshot, 
            price_in_cycle, 
            is_available_in_cycle, 
            display_image_url, 
            products ( product_id, name, description, image_url, attributes )
          `)
          .eq('cycle_id', cycleData.cycle_id)
          .eq('is_available_in_cycle', true);

        if (productsError) {
          console.error("Error fetching cycle products:", productsError);
          setAllProducts([]);
          setFilteredProducts([]);
          setIsLoading(false);
          return;
        }

        const displayableProducts: DisplayableProduct[] = productsData ? productsData.map(cp => ({
          cycleProductId: cp.cycle_product_id,
          cycleId: cp.cycle_id,
          productId: cp.products?.product_id || cp.product_id,
          name: cp.product_name_snapshot || cp.products?.name || 'Unknown Product',
          description: cp.products?.description || '',
          imageUrl: cp.display_image_url || cp.products?.image_url || 'https://placehold.co/400x300.png?text=Produto',
          attributes: cp.products?.attributes || {},
          price: cp.price_in_cycle,
          isAvailableInCycle: cp.is_available_in_cycle,
        })) : [];

        setAllProducts(displayableProducts);
      } catch (error) {
        console.error("Failed to load homepage data:", error);
        setCycleTitle("Erro ao carregar dados da página");
        setCycleDescription(null);
        setAllProducts([]);
        setFilteredProducts([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const extractAttributeValues = useMemo(() => (attributeKey: string) => {
    const values = new Set<string>();
    allProducts.forEach(p => {
      if (p.attributes && typeof p.attributes === 'object' && p.attributes[attributeKey]) {
        const attributeValue = p.attributes[attributeKey];
        if (Array.isArray(attributeValue)) {
          attributeValue.forEach(v => { if (v) values.add(String(v))});
        } else if (typeof attributeValue === 'string' && attributeValue) {
           values.add(attributeValue);
        }
      }
    });
    return Array.from(values).sort();
  }, [allProducts]);

  const categoryOptions = useMemo(() => extractAttributeValues(CATEGORY_ATTRIBUTE_KEY), [extractAttributeValues]);
  const cacaoOptions = useMemo(() => extractAttributeValues(CACAO_ATTRIBUTE_KEY), [extractAttributeValues]);
  const dietaryOptions = useMemo(() => extractAttributeValues(DIETARY_ATTRIBUTE_KEY), [extractAttributeValues]);
  const weightOptions = useMemo(() => extractAttributeValues(WEIGHT_ATTRIBUTE_KEY), [extractAttributeValues]);

  useEffect(() => {
    let products = [...allProducts];

    if (searchTerm) {
      products = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedCategories.length > 0) {
      products = products.filter(p =>
        p.attributes?.[CATEGORY_ATTRIBUTE_KEY] && Array.isArray(p.attributes[CATEGORY_ATTRIBUTE_KEY]) &&
        selectedCategories.some(cat => (p.attributes[CATEGORY_ATTRIBUTE_KEY] as string[]).includes(cat))
      );
    }
    if (selectedCacao.length > 0) {
      products = products.filter(p =>
         p.attributes?.[CACAO_ATTRIBUTE_KEY] && Array.isArray(p.attributes[CACAO_ATTRIBUTE_KEY]) &&
        selectedCacao.some(c => (p.attributes[CACAO_ATTRIBUTE_KEY] as string[]).includes(c))
      );
    }
    if (selectedDietary.length > 0) {
      products = products.filter(p =>
        p.attributes?.[DIETARY_ATTRIBUTE_KEY] && Array.isArray(p.attributes[DIETARY_ATTRIBUTE_KEY]) &&
        selectedDietary.every(diet => (p.attributes[DIETARY_ATTRIBUTE_KEY] as string[]).includes(diet))
      );
    }
     if (selectedWeights.length > 0) {
      products = products.filter(p =>
        p.attributes?.[WEIGHT_ATTRIBUTE_KEY] && Array.isArray(p.attributes[WEIGHT_ATTRIBUTE_KEY]) &&
        selectedWeights.some(w => (p.attributes[WEIGHT_ATTRIBUTE_KEY] as string[]).includes(w))
      );
    }
    const numMinPrice = parseFloat(minPrice);
    if (!isNaN(numMinPrice)) {
      products = products.filter(p => p.price >= numMinPrice);
    }
    const numMaxPrice = parseFloat(maxPrice);
    if (!isNaN(numMaxPrice)) {
      products = products.filter(p => p.price <= numMaxPrice);
    }

    products.sort((a, b) => {
      switch (sortOrder) {
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'name-asc': default: return a.name.localeCompare(b.name);
      }
    });

    setFilteredProducts(products);
  }, [searchTerm, selectedCategories, selectedCacao, selectedDietary, selectedWeights, minPrice, maxPrice, sortOrder, allProducts]);

  const handleMultiCheckboxChange = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setter(prev =>
      prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedCacao([]);
    setSelectedDietary([]);
    setSelectedWeights([]);
    setMinPrice('');
    setMaxPrice('');
    setSortOrder('name-asc');
  };
  
  const hasActiveFilters = searchTerm || selectedCategories.length > 0 || selectedCacao.length > 0 || selectedDietary.length > 0 || selectedWeights.length > 0 || minPrice || maxPrice;

  if (isLoading) {
    return (
      <PageContainer className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando delícias...</p>
      </PageContainer>
    );
  }
  
  const FilterCheckboxGroup = ({ title, options, selectedValues, onChange }: { title: string, options: string[], selectedValues: string[], onChange: (value: string) => void }) => (
    options.length > 0 ? (
      <div className="mb-4">
        <h4 className="font-semibold mb-2 text-sm">{title}</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
          {options.map(option => (
            <div key={option} className="flex items-center space-x-2">
              <Checkbox
                id={`${title}-${option}`}
                checked={selectedValues.includes(option)}
                onCheckedChange={() => onChange(option)}
              />
              <Label htmlFor={`${title}-${option}`} className="text-sm font-normal cursor-pointer">
                {option}
              </Label>
            </div>
          ))}
        </div>
      </div>
    ) : null
  );


  return (
    <PageContainer>
      <section className="text-center my-8 md:my-12">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary mb-2">
          {cycleTitle}
        </h1>
        {cycleDescription && (
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
            {cycleDescription}
          </p>
        )}
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Descubra nossa seleção exclusiva de chocolates artesanais, preparados com os melhores ingredientes para este ciclo de compra.
        </p>
      </section>

      <div className="mb-8">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="filters">
            <AccordionTrigger
              className={cn(
                buttonVariants({ variant: 'outline', size: 'default' }),
                'w-full md:w-auto',
                'flex justify-between'
              )}
            >
              <span className="flex items-center">
                <Filter size={18} className="mr-2" />
                Filtros e Ordenação
                {hasActiveFilters && <span className="ml-2 h-2 w-2 rounded-full bg-primary" />}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <Card>
                <CardContent className="p-4 md:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 mb-6">
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
                    <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="min-price" className="text-sm font-medium">Preço Mínimo (R$)</Label>
                        <Input
                          id="min-price"
                          type="number"
                          placeholder="Ex: 10"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          className="mt-1"
                          min="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="max-price" className="text-sm font-medium">Preço Máximo (R$)</Label>
                        <Input
                          id="max-price"
                          type="number"
                          placeholder="Ex: 150"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          className="mt-1"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 border-t border-border pt-6">
                    <FilterCheckboxGroup title="Categoria" options={categoryOptions} selectedValues={selectedCategories} onChange={(val) => handleMultiCheckboxChange(setSelectedCategories, val)} />
                    <FilterCheckboxGroup title="Teor de Cacau" options={cacaoOptions} selectedValues={selectedCacao} onChange={(val) => handleMultiCheckboxChange(setSelectedCacao, val)} />
                    <FilterCheckboxGroup title="Dietas e Restrições" options={dietaryOptions} selectedValues={selectedDietary} onChange={(val) => handleMultiCheckboxChange(setSelectedDietary, val)} />
                    <FilterCheckboxGroup title="Peso do Produto" options={weightOptions} selectedValues={selectedWeights} onChange={(val) => handleMultiCheckboxChange(setSelectedWeights, val)} />
                  </div>

                  {hasActiveFilters && (
                    <div className="mt-6 pt-4 border-t border-border flex justify-end">
                      <Button variant="ghost" onClick={clearFilters} className="text-sm">
                        <X size={16} className="mr-1" />
                        Limpar Todos os Filtros
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      
      {allProducts.length === 0 && !isLoading && ( 
        <Card className="shadow-lg">
            <CardContent className="p-10 text-center flex flex-col items-center">
                <PackageSearch size={48} className="mx-auto text-muted-foreground mb-4" />
                <CardTitle className="text-xl font-semibold mb-2">Nenhum Produto Disponível</CardTitle>
                <p className="text-muted-foreground">Não há produtos cadastrados para este ciclo de compra no momento.</p>
            </CardContent>
        </Card>
      )}

      {allProducts.length > 0 && filteredProducts.length === 0 && !isLoading && ( 
        <Card className="shadow-lg">
            <CardContent className="p-10 text-center flex flex-col items-center">
                <ListFilter size={48} className="mx-auto text-muted-foreground mb-4" />
                <CardTitle className="text-xl font-semibold mb-2">Nenhum Produto Encontrado</CardTitle>
                <p className="text-muted-foreground">Não encontramos produtos com os filtros selecionados.</p>
                <Button onClick={clearFilters} variant="link" className="mt-2">Limpar filtros</Button>
            </CardContent>
        </Card>
      )}

      <ProductGrid products={filteredProducts} />
    </PageContainer>
  );
}

