"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Product, Season } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { PageContainer } from '@/components/shared/page-container';
import { ProductForm } from '@/components/admin/product-form';
import { PlusCircle, Edit3, Trash2 } from 'lucide-react';
import { fetchAdminProducts, createProduct, updateProduct, deleteProduct, fetchSeasons } from '@/lib/supabasePlaceholders';
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
  const [seasonsMap, setSeasonsMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  async function loadData() {
    setIsLoading(true);
    try {
      const [productsData, seasonsData] = await Promise.all([
        fetchAdminProducts(),
        fetchSeasons()
      ]);
      setProducts(productsData);
      
      const sMap: Record<string, string> = {};
      seasonsData.forEach(s => { sMap[s.id] = s.name; });
      setSeasonsMap(sMap);

    } catch (error) {
      console.error("Failed to fetch products or seasons:", error);
      toast({ title: "Erro ao Carregar", description: "Não foi possível carregar dados.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleFormSubmit = async (data: Omit<Product, 'id' | 'imageUrl'> & {imageUrl?: string} | (Partial<Product> & { id: string })) => {
    try {
      if ('id' in data && data.id) { // Editing
        await updateProduct(data.id, data);
      } else { // Creating
        await createProduct(data as Omit<Product, 'id'>);
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      await loadData(); // Refresh list
    } catch (error) {
      // Toast is handled within ProductForm
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
      toast({ title: "Produto Deletado", description: `O produto "${productName}" foi deletado.` });
      await loadData(); // Refresh list
    } catch (error) {
      toast({ title: "Erro ao Deletar", description: "Não foi possível deletar o produto.", variant: "destructive" });
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
        <DialogContent className="sm:max-w-[600px] bg-card">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl">
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            initialData={editingProduct}
            onSubmit={handleFormSubmit}
            onClose={() => { setIsModalOpen(false); setEditingProduct(null); }}
          />
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <p>Carregando produtos...</p>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg shadow">
            <p className="text-xl text-muted-foreground mb-4">Nenhum produto cadastrado.</p>
            <Button onClick={openNewProductModal}>
              <PlusCircle size={18} className="mr-2" />
              Criar Primeiro Produto
            </Button>
        </div>
      ) : (
        <div className="bg-card p-6 rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Imagem</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Temporada</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Image
                      src={product.imageUrl || 'https://placehold.co/80x80.png?text=Img'}
                      alt={product.name}
                      width={60}
                      height={60}
                      className="rounded-md object-cover"
                      data-ai-hint="chocolate thumbnail"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>R$ {product.price.toFixed(2).replace('.', ',')}</TableCell>
                  <TableCell>{product.seasonId ? seasonsMap[product.seasonId] || 'N/A' : 'N/A'}</TableCell>
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
                            Tem certeza que deseja deletar o produto "{product.name}"? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteProduct(product.id, product.name)}>
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
