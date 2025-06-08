
"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import type { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { PageContainer } from '@/components/shared/page-container';
import { ProductForm } from '@/components/admin/product-form';
import { PlusCircle, Edit3, Trash2, Loader2, Archive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card'; // Added Card imports

export default function ProductManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;

      const mappedProducts: Product[] = data.map(p => ({
        productId: p.product_id,
        name: p.name,
        description: p.description,
        imageUrl: p.image_url, 
        attributes: p.attributes,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }));
      setProducts(mappedProducts);
    } catch (error: any) {
      toast({ title: "Erro ao Carregar Produtos", description: error.message || "Não foi possível carregar a lista de produtos.", variant: "destructive" });
      setProducts([]); // Ensure products is an empty array on error
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleFormSubmit = async (
    productFormData: Omit<Product, 'productId' | 'createdAt' | 'updatedAt'> | (Partial<Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>> & { productId: string })
  ): Promise<Product> => {
    try {
      if ('productId' in productFormData && productFormData.productId) {
        const { productId, ...updateData } = productFormData;
        const dbUpdatePayload: Record<string, any> = {
          name: updateData.name,
          description: updateData.description,
          attributes: updateData.attributes,
          image_url: updateData.imageUrl, 
        };

        const { data: updatedDbProduct, error } = await supabase
          .from('products')
          .update(dbUpdatePayload)
          .eq('product_id', productId)
          .select()
          .single();
        if (error) throw error;

        const updatedProduct: Product = {
          productId: updatedDbProduct.product_id,
          name: updatedDbProduct.name,
          description: updatedDbProduct.description,
          imageUrl: updatedDbProduct.image_url,
          attributes: updatedDbProduct.attributes,
          createdAt: updatedDbProduct.created_at,
          updatedAt: updatedDbProduct.updated_at,
        };
        toast({ title: "Produto Atualizado", description: `O produto "${updatedProduct.name}" foi atualizado.` });
        await loadProducts(); 
        return updatedProduct;

      } else {
        const dbPayload: Record<string, any> = {
          name: productFormData.name,
          description: productFormData.description,
          image_url: productFormData.imageUrl, 
          attributes: productFormData.attributes,
        };
        const { data: insertedDbProduct, error } = await supabase
          .from('products')
          .insert([dbPayload])
          .select()
          .single();
        if (error) throw error;

        const newProduct: Product = {
          productId: insertedDbProduct.product_id,
          name: insertedDbProduct.name,
          description: insertedDbProduct.description,
          imageUrl: insertedDbProduct.image_url,
          attributes: insertedDbProduct.attributes,
          createdAt: insertedDbProduct.created_at,
          updatedAt: insertedDbProduct.updated_at,
        };
        toast({ title: "Produto Criado", description: `O produto "${newProduct.name}" foi criado.` });
        await loadProducts(); 
        return newProduct;
      }
    } catch (error: any) {
      console.error("Error in handleFormSubmit (products page):", error);
      toast({ title: "Erro ao Salvar Produto", description: error.message || "Não foi possível salvar o produto.", variant: "destructive" });
      throw error; 
    }
  };

  const openNewProductModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('product_id', productId);
      if (error) throw error;
      toast({ title: "Produto Deletado", description: `O produto "${productName}" foi deletado.` });
      await loadProducts();
    } catch (error: any) {
      toast({ title: "Erro ao Deletar", description: error.message || "Não foi possível deletar o produto. Verifique se ele está associado a algum ciclo de compra.", variant: "destructive" });
    }
  };

  return (
    <PageContainer className="py-8">
      <AdminPageHeader
        title="Gerenciamento de Produtos"
        actionButton={
          <Button onClick={openNewProductModal}>
            <PlusCircle size={18} className="mr-2" />
            Novo Produto
          </Button>
        }
      />

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => { setIsModalOpen(isOpen); if (!isOpen) setEditingProduct(null); }}>
        <DialogContent 
          key={editingProduct ? `modal-product-${editingProduct.productId}` : 'modal-product-new'}
          className="sm:max-w-[600px] bg-card shadow-lg"
        >
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            key={editingProduct ? `form-product-${editingProduct.productId}` : 'form-product-new'}
            initialData={editingProduct}
            onSubmit={handleFormSubmit}
            onClose={(savedProduct) => {
              setIsModalOpen(false);
              setEditingProduct(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
          <p className="text-muted-foreground">Carregando produtos...</p>
        </div>
      ) : products.length === 0 ? (
        <Card className="shadow-lg">
          <CardContent className="p-10 text-center flex flex-col items-center">
            <Archive size={48} className="mx-auto text-muted-foreground mb-4" />
            <DialogTitle className="text-xl font-semibold mb-2">Nenhum Produto Cadastrado</DialogTitle>
            <p className="text-muted-foreground mb-6">Você ainda não adicionou nenhum produto ao catálogo.</p>
            <Button onClick={openNewProductModal}>
              <PlusCircle size={18} className="mr-2" />
              Criar Primeiro Produto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-card p-6 rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Imagem</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição Curta</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.productId}>
                 <TableCell>
                    <Image
                      src={product.imageUrl || 'https://placehold.co/80x80.png?text=Img'}
                      alt={product.name}
                      width={60}
                      height={60}
                      className="rounded-md object-cover"
                      data-ai-hint="chocolate item"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="truncate max-w-xs">{product.description.substring(0, 50)}...</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEditProductModal(product)}>
                      <Edit3 size={16} className="mr-1" /> Editar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                           <Trash2 size={16} className="mr-1" /> Deletar
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Deleção</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja deletar o produto &quot;{product.name}&quot;? Esta ação não pode ser desfeita. Produtos associados a ciclos de compra ativos ou pedidos podem não ser deletados.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteProduct(product.productId, product.name)}>
                            Deletar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PageContainer>
  );
}
