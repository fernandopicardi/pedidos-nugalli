
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import type { PurchaseCycle, CycleProductWithProductDetails, Product as MasterProduct } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { PageContainer } from '@/components/shared/page-container';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import {
  fetchPurchaseCycleById,
  fetchCycleProductsWithDetails,
  fetchMasterProductsNotInCycle,
  updateCycleProduct,
  deleteCycleProduct,
  createCycleProduct
} from '@/lib/supabasePlaceholders';
import { Loader2, PlusCircle, Edit3, Trash2, PackageSearch, ArrowLeft, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EditCycleProductDialog } from '@/components/admin/manage-cycle-products/edit-cycle-product-dialog';
import { AddProductToCycleDialog } from '@/components/admin/manage-cycle-products/add-product-to-cycle-dialog';
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

export default function ManageCycleProductsPage() {
  const params = useParams();
  const router = useRouter();
  const cycleId = typeof params.cycleId === 'string' ? params.cycleId : '';
  const { toast } = useToast();

  const [purchaseCycle, setPurchaseCycle] = useState<PurchaseCycle | null>(null);
  const [cycleProducts, setCycleProducts] = useState<CycleProductWithProductDetails[]>([]);
  const [availableMasterProducts, setAvailableMasterProducts] = useState<MasterProduct[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCycleProducts, setIsLoadingCycleProducts] = useState(false);
  const [isLoadingMasterProducts, setIsLoadingMasterProducts] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCycleProduct, setSelectedCycleProduct] = useState<CycleProductWithProductDetails | null>(null);

  const loadCycleDetails = useCallback(async () => {
    if (!cycleId) {
      setIsLoading(false);
      toast({ title: "Erro", description: "ID do Ciclo de Compra inválido.", variant: "destructive" });
      router.push('/admin/purchase-cycles');
      return;
    }
    try {
      const cycle = await fetchPurchaseCycleById(cycleId);
      if (cycle) {
        setPurchaseCycle(cycle);
      } else {
        toast({ title: "Ciclo não Encontrado", description: "O ciclo de compra especificado não foi encontrado.", variant: "destructive" });
        router.push('/admin/purchase-cycles');
      }
    } catch (error: any) {
      toast({ title: "Erro ao Carregar Ciclo", description: error.message, variant: "destructive" });
    }
  }, [cycleId, toast, router]);

  const loadCycleProducts = useCallback(async () => {
    if (!cycleId) return;
    setIsLoadingCycleProducts(true);
    try {
      const products = await fetchCycleProductsWithDetails(cycleId);
      setCycleProducts(products);
    } catch (error: any) {
      toast({ title: "Erro ao Carregar Produtos do Ciclo", description: error.message, variant: "destructive" });
    } finally {
      setIsLoadingCycleProducts(false);
    }
  }, [cycleId, toast]);

  const loadMasterProducts = useCallback(async () => {
    if (!cycleId) return;
    setIsLoadingMasterProducts(true);
    try {
      const products = await fetchMasterProductsNotInCycle(cycleId);
      setAvailableMasterProducts(products);
    } catch (error: any) {
      toast({ title: "Erro ao Carregar Produtos Disponíveis", description: error.message, variant: "destructive" });
    } finally {
      setIsLoadingMasterProducts(false);
    }
  }, [cycleId, toast]);

  useEffect(() => {
    async function initialLoad() {
      setIsLoading(true);
      await loadCycleDetails();
      await loadCycleProducts();
      setIsLoading(false);
    }
    initialLoad();
  }, [loadCycleDetails, loadCycleProducts]);

  const handleOpenEditModal = (product: CycleProductWithProductDetails) => {
    setSelectedCycleProduct(product);
    setIsEditModalOpen(true);
  };

  const handleOpenAddModal = () => {
    loadMasterProducts(); // Refresh list of available products
    setIsAddModalOpen(true);
  };

  const handleEditSubmit = async (updatedData: { priceInCycle: number; isAvailableInCycle: boolean }) => {
    if (!selectedCycleProduct) return;
    try {
      await updateCycleProduct(selectedCycleProduct.cycleProductId, {
        price_in_cycle: updatedData.priceInCycle,
        is_available_in_cycle: updatedData.isAvailableInCycle,
      });
      toast({ title: "Produto do Ciclo Atualizado", description: `"${selectedCycleProduct.productNameSnapshot}" foi atualizado.` });
      setIsEditModalOpen(false);
      setSelectedCycleProduct(null);
      loadCycleProducts(); // Refresh list
    } catch (error: any) {
      toast({ title: "Erro ao Atualizar", description: error.message, variant: "destructive" });
    }
  };

  const handleAddSubmit = async (masterProductId: string, price: number, isAvailable: boolean, nameSnapshot: string, imageSnapshotUrl?: string) => {
    try {
      await createCycleProduct({
        cycle_id: cycleId,
        product_id: masterProductId,
        product_name_snapshot: nameSnapshot,
        price_in_cycle: price,
        is_available_in_cycle: isAvailable,
        display_image_url: imageSnapshotUrl, // Use master product image if not specified for cycle
      });
      toast({ title: "Produto Adicionado ao Ciclo", description: `"${nameSnapshot}" foi adicionado.` });
      setIsAddModalOpen(false);
      loadCycleProducts(); // Refresh list of cycle products
    } catch (error: any) {
      toast({ title: "Erro ao Adicionar", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteCycleProduct = async (cycleProd: CycleProductWithProductDetails) => {
    try {
      await deleteCycleProduct(cycleProd.cycleProductId);
      toast({ title: "Produto Removido do Ciclo", description: `"${cycleProd.productNameSnapshot}" foi removido do ciclo.` });
      loadCycleProducts(); // Refresh list
    } catch (error: any) {
      toast({ title: "Erro ao Remover", description: error.message, variant: "destructive" });
    }
  };

  if (isLoading || !purchaseCycle) {
    return (
      <PageContainer className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando dados do ciclo...</p>
      </PageContainer>
    );
  }
  
  const formatDate = (dateString?: string) => dateString ? new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour:'2-digit', minute:'2-digit', timeZone: 'UTC'}) : 'N/A';

  return (
    <PageContainer className="py-8">
      <Button variant="outline" onClick={() => router.push('/admin/purchase-cycles')} className="mb-6">
        <ArrowLeft size={18} className="mr-2" />
        Voltar para Lista de Ciclos
      </Button>

      <AdminPageHeader
        title={`Gerenciar Produtos: ${purchaseCycle.name}`}
        actionButton={
          <Button onClick={handleOpenAddModal}>
            <PlusCircle size={18} className="mr-2" />
            Adicionar Produto ao Ciclo
          </Button>
        }
      />
      <Card className="mb-6 shadow-md">
        <CardHeader>
          <CardTitle className="font-headline text-xl">Detalhes do Ciclo</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
            <p><strong>Status:</strong> <Badge variant={purchaseCycle.isActive ? "default" : "secondary"}>{purchaseCycle.isActive ? 'Ativo' : 'Inativo'}</Badge></p>
            <p><strong>Início:</strong> {formatDate(purchaseCycle.startDate)}</p>
            <p><strong>Fim:</strong> {formatDate(purchaseCycle.endDate)}</p>
            {purchaseCycle.description && <p className="md:col-span-2"><strong>Descrição:</strong> {purchaseCycle.description}</p>}
        </CardContent>
      </Card>


      {isLoadingCycleProducts ? (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
          <p className="text-muted-foreground">Carregando produtos do ciclo...</p>
        </div>
      ) : cycleProducts.length === 0 ? (
        <Card className="shadow-lg">
            <CardContent className="p-10 text-center flex flex-col items-center">
                <PackageSearch size={48} className="mx-auto text-muted-foreground mb-4" />
                <CardTitle className="text-xl font-semibold mb-2">Nenhum Produto Neste Ciclo</CardTitle>
                <p className="text-muted-foreground mb-6">Adicione produtos a este ciclo para gerenciá-los aqui.</p>
                 <Button onClick={handleOpenAddModal}>
                    <PlusCircle size={18} className="mr-2" />
                    Adicionar Primeiro Produto
                </Button>
            </CardContent>
        </Card>
      ) : (
        <div className="bg-card p-4 md:p-6 rounded-lg shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[70px]">Imagem</TableHead>
                <TableHead>Nome no Ciclo</TableHead>
                <TableHead className="w-[120px]">Preço no Ciclo</TableHead>
                <TableHead className="w-[120px]">Disponível?</TableHead>
                <TableHead className="text-right w-[200px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cycleProducts.map((cp) => (
                <TableRow key={cp.cycleProductId}>
                  <TableCell>
                    <Image
                      src={cp.displayImageUrl || cp.product?.imageUrl || 'https://placehold.co/80x80.png?text=Img'}
                      alt={cp.productNameSnapshot}
                      width={50}
                      height={50}
                      className="rounded-md object-cover"
                      data-ai-hint="chocolate product"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{cp.productNameSnapshot}</TableCell>
                  <TableCell>R$ {cp.priceInCycle.toFixed(2).replace('.', ',')}</TableCell>
                  <TableCell>
                    <Badge variant={cp.isAvailableInCycle ? 'default' : 'secondary'}>
                      {cp.isAvailableInCycle ? 'Sim' : 'Não'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(cp)}>
                      <Edit3 size={16} className="mr-1" /> Editar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                           <Trash2 size={16} className="mr-1" /> Remover
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover Produto do Ciclo</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover "{cp.productNameSnapshot}" deste ciclo de compra ({purchaseCycle.name})? O produto mestre não será afetado.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteCycleProduct(cp)}>
                            Remover do Ciclo
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

      {isEditModalOpen && selectedCycleProduct && (
        <EditCycleProductDialog
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedCycleProduct(null);
          }}
          cycleProduct={selectedCycleProduct}
          onSubmit={handleEditSubmit}
        />
      )}

      {isAddModalOpen && (
        <AddProductToCycleDialog
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          cycleId={cycleId}
          cycleName={purchaseCycle.name}
          masterProducts={availableMasterProducts}
          isLoadingMasterProducts={isLoadingMasterProducts}
          onSubmit={handleAddSubmit}
          existingCycleProductIds={cycleProducts.map(cp => cp.productId)}
        />
      )}
    </PageContainer>
  );
}
