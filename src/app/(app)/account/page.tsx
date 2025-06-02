
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { PageContainer } from '@/components/shared/page-container';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser, updateUserDetails, signOut } from '@/lib/supabasePlaceholders';
import type { User as AppUser, Address } from '@/types';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function AccountPage() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  // Address state
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      setIsLoading(true);
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setDisplayName(currentUser.displayName);
        setWhatsapp(currentUser.whatsapp || ''); // Ensure WhatsApp is populated, even if empty for now
        
        // Populate address fields
        setStreet(currentUser.address?.street || '');
        setNumber(currentUser.address?.number || '');
        setComplement(currentUser.address?.complement || '');
        setNeighborhood(currentUser.address?.neighborhood || '');
        setCity(currentUser.address?.city || '');
        setState(currentUser.address?.state || '');
        setZipCode(currentUser.address?.zipCode || '');

      } else {
        router.push('/auth');
      }
      setIsLoading(false);
    }
    loadUser();
  }, [router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;

    setIsSubmitting(true);

    const updatedAddress: Address = {
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      zipCode,
    };

    const { error, user: updatedUser } = await updateUserDetails(user.userId, { 
      displayName, 
      whatsapp,
      address: updatedAddress 
    });
    setIsSubmitting(false);

    if (error) {
      toast({ title: "Erro ao Atualizar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Dados Atualizados", description: "Suas informações foram salvas com sucesso." });
      if (updatedUser) setUser(updatedUser); 
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Logout Efetuado", description: "Você foi desconectado." });
    setUser(null); 
    router.push('/'); 
  };


  if (isLoading) {
    return (
      <PageContainer className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando dados da conta...</p>
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer className="text-center py-12">
        <p>Você precisa estar logado para acessar esta página.</p>
        <Button onClick={() => router.push('/auth')} className="mt-4">Ir para Login</Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="max-w-2xl mx-auto my-8 md:my-12">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-3xl text-center">Minha Conta</CardTitle>
          <CardDescription className="text-center">Gerencie suas informações pessoais e de entrega.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user.email}
                readOnly
                className="bg-muted cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Nome de Exibição</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Seu nome completo"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                type="tel"
                placeholder="Ex: 5511999998888"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                required
              />
               <p className="text-xs text-muted-foreground">Inclua o código do país (ex: 55 para Brasil). Obrigatório.</p>
            </div>

            <Separator className="my-6" />
            <h3 className="text-xl font-headline text-foreground">Endereço de Entrega</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="street">Logradouro (Rua/Avenida)</Label>
                <Input id="street" placeholder="Ex: Rua das Flores" value={street} onChange={(e) => setStreet(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="number">Número</Label>
                <Input id="number" placeholder="Ex: 123" value={number} onChange={(e) => setNumber(e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="complement">Complemento (Opcional)</Label>
                <Input id="complement" placeholder="Ex: Apto 101, Bloco B" value={complement} onChange={(e) => setComplement(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input id="neighborhood" placeholder="Ex: Centro" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input id="city" placeholder="Ex: São Paulo" value={city} onChange={(e) => setCity(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input id="state" placeholder="Ex: SP" value={state} onChange={(e) => setState(e.target.value)} required />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="zipCode">CEP</Label>
              <Input id="zipCode" placeholder="Ex: 01000-000" value={zipCode} onChange={(e) => setZipCode(e.target.value)} required />
            </div>

          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
            <Button type="button" variant="outline" onClick={handleSignOut} className="w-full sm:w-auto">
              <LogOut size={18} className="mr-2" /> Sair (Logout)
            </Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </PageContainer>
  );
}
