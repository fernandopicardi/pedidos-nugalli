
"use client";

import { useState, useEffect, type FormEvent } from 'react';
import { PageContainer } from '@/components/shared/page-container';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser, updateUserDetails, signOut } from '@/lib/supabasePlaceholders';
import type { User as AppUser } from '@/types';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut } from 'lucide-react';

export default function AccountPage() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
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
        setWhatsapp(currentUser.whatsapp || '');
      } else {
        // If no user, redirect to auth page
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
    const { error, user: updatedUser } = await updateUserDetails(user.userId, { displayName, whatsapp });
    setIsSubmitting(false);

    if (error) {
      toast({ title: "Erro ao Atualizar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Dados Atualizados", description: "Suas informações foram salvas com sucesso." });
      if (updatedUser) setUser(updatedUser); // Update local state with fresh user data
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Logout Efetuado", description: "Você foi desconectado." });
    setUser(null); // Clear user state locally
    router.push('/'); // Redirect to home page
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
     // This case should ideally be handled by the redirect in useEffect,
     // but as a fallback:
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
          <CardDescription className="text-center">Gerencie suas informações pessoais e preferências.</CardDescription>
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
                placeholder="Seu nome"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp (opcional)</Label>
              <Input
                id="whatsapp"
                type="tel"
                placeholder="Ex: 5511999998888"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
               <p className="text-xs text-muted-foreground">Inclua o código do país (ex: 55 para Brasil).</p>
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
