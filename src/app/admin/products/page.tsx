
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Product } from '@/types'; // Using master Product type
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { PageContainer } from '@/components/shared/page-container';
import { ProductForm } from '@/components/admin/product-form';
import { PlusCircle, Edit3, Trash2 } from 'lucide-react';
import { fetchAdminProducts, createProduct, updateProduct, deleteProduct } from '@/lib/supabasePlaceholders';
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

export default function ProductManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  async function loadMasterProducts() {
    setIsLoading(true);
    try {
      const productsData = await fetchAdminProducts();
      setProducts(productsData);
    } catch (error) {
      console.error("Failed to fetch master products:", error);
      toast({ title: "Erro ao Carregar Produtos", description: "Não foi possível carregar a lista de produtos mestre.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadMasterProducts();
  }, []);

  const handleFormSubmit = async (data: Omit<Product, 'productId' | 'createdAt' | 'updatedAt'> | (Partial<Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>> & { productId: string })): Promise<Product | {productId: string}> => {
    // This function is now a bit more complex because ProductForm also calls setProductAvailabilityInActiveCycle
    // The main purpose here is to handle the master product CRUD.
    try {
      if ('productId' in data && data.productId) { // Editing
        const updated = await updateProduct(data.productId, data as Partial<Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>>);
        await loadMasterProducts(); 
        return updated;
      } else { // Creating
        const created = await createProduct(data as Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>);
        await loadMasterProducts(); 
        return created;
      }
    } catch (error) {
      // Toast is handled within ProductForm or supabasePlaceholders for more specific messages
      console.error("Error in handleFormSubmit (ProductManagementPage):", error);
      throw error; // Re-throw to be caught by ProductForm's handler
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
      await deleteProduct(productId);
      toast({ title: "Produto Deletado", description: `O produto "${productName}" foi deletado da lista mestre.` });
      await loadMasterProducts(); 
    } catch (error) {
      toast({ title: "Erro ao Deletar", description: "Não foi possível deletar o produto.", variant: "destructive" });
    }
  };

  return (
    <PageContainer className="py-8">
      <AdminPageHeader
        title="Gerenciamento de Produtos (Catálogo Mestre)"
        actionButton={
          <Button onClick={openNewProductModal}>
            <PlusCircle size={18} className="mr-2" />
            Novo Produto Mestre
          </Button>
        }
      />

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => { setIsModalOpen(isOpen); if (!isOpen) setEditingProduct(null); }}>
        <DialogContent className="sm:max-w-[600px] bg-card shadow-lg">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">
              {editingProduct ? 'Editar Produto Mestre' : 'Novo Produto Mestre'}
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            initialData={editingProduct}
            onSubmit={handleFormSubmit} // onSubmit in ProductForm now handles more
            onClose={() => { setIsModalOpen(false); setEditingProduct(null); }}
          />
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <p>Carregando produtos mestre...</p>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg shadow">
            <p className="text-xl text-muted-foreground mb-4">Nenhum produto mestre cadastrado.</p>
            <Button onClick={openNewProductModal}>
              <PlusCircle size={18} className="mr-2" />
              Criar Primeiro Produto Mestre
            </Button>
        </div>
      ) : (
        <div className="bg-card p-6 rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Imagem Principal</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição Curta</TableHead>
                {/* <TableHead>Sazonal (Mestre)?</TableHead> Removed as per new logic */}
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.productId}>
                  <TableCell>
                    <Image
                      src={product.imageUrls[0] || 'https://placehold.co/80x80.png?text=Img'}
                      alt={product.name}
                      width={60}
                      height={60}
                      className="rounded-md object-cover"
                      data-ai-hint="chocolate thumbnail"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="truncate max-w-xs">{product.description.substring(0, 50)}...</TableCell>
                  {/* <TableCell>{product.isSeasonal ? 'Sim' : 'Não'}</TableCell> Removed */}
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
                            Tem certeza que deseja deletar o produto mestre "{product.name}"? Esta ação não pode ser desfeita e removerá o produto de futuros ciclos.
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

