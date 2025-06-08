
"use client";

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/auth';
import { updateUserDetails, getCurrentUser } from '@/lib/supabasePlaceholders';

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Address fields
  const [addressStreet, setAddressStreet] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [addressComplement, setAddressComplement] = useState('');
  const [addressNeighborhood, setAddressNeighborhood] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [addressZip, setAddressZip] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const redirectToStoredPathOrFallback = (fallbackPath: string = '/') => {
    const redirectPath = sessionStorage.getItem('redirectAfterLogin');
    if (redirectPath) {
      sessionStorage.removeItem('redirectAfterLogin');
      router.push(redirectPath);
    } else {
      router.push(fallbackPath);
    }
  };

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Erro no Cadastro", description: "As senhas não coincidem.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const initialProfileDataForAuth = {
      // displayName e whatsapp serão definidos com padrões em auth.ts se não fornecidos aqui.
      // O objetivo principal é passar os dados de endereço para auth.users.raw_user_meta_data
      // para que um trigger (ou o fallback em getUser) possa usá-los.
      addressStreet,
      addressNumber,
      addressComplement,
      addressNeighborhood,
      addressCity,
      addressState,
      addressZip,
    };

    const { user: authUserResult, session: signUpSession, error: signUpError } = await signUp(email, password, initialProfileDataForAuth);

    if (signUpError) {
      toast({ title: "Erro no Cadastro", description: signUpError.message, variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    if (authUserResult && !signUpSession) {
      // Email confirmation required
      toast({
        title: "Verifique seu Email",
        description: "Um link de confirmação foi enviado. Por favor, ative sua conta para continuar.",
        duration: 9000,
      });
      router.push('/auth');
      setIsSubmitting(false);
      return;
    }

    if (authUserResult && signUpSession) {
      // Usuário cadastrado E com sessão.
      // Agora, garanta que o perfil na tabela 'profiles' está consistente.
      // getCurrentUser() irá buscá-lo, e seu getUser() subjacente tentará a criação se estiver faltando.
      const profileUser = await getCurrentUser();

      if (!profileUser) {
        // Isso seria inesperado se o signUp foi bem-sucedido e a sessão existe,
        // pois getCurrentUser (via getUser) deveria ter criado o perfil se estivesse faltando.
        // Indica um problema mais profundo (ex: a lógica de criação do getUser falhou).
        toast({ title: "Erro Pós-Cadastro", description: "Conta criada, mas falha ao obter/criar detalhes do perfil. Por favor, tente atualizar na sua conta.", variant: "destructive", duration: 10000 });
        redirectToStoredPathOrFallback('/'); // Ainda redireciona, a conta existe.
        setIsSubmitting(false);
        return;
      }

      // Neste ponto, profileUser deve ser o objeto User com dados de 'profiles'.
      // Podemos chamar updateUserDetails para sincronizar os campos de endereço do formulário.
      // displayName e whatsapp não estão neste formulário, são tratados por padrões em auth.ts -> signUp
      // ou atualizados na página da conta.
      const { error: updateError } = await updateUserDetails(profileUser.userId, {
        addressStreet,
        addressNumber,
        addressComplement,
        addressNeighborhood,
        addressCity,
        addressState,
        addressZip,
      });

      if (updateError) {
        console.error("Error explicitly updating profile address details after signup & profile check:", updateError.message);
        toast({
          title: "Cadastro Concluído com Avisos",
          description: `Sua conta foi criada. Houve um erro ao salvar/sincronizar detalhes do endereço: ${updateError.message}. Você pode tentar atualizá-los na sua página de conta.`,
          variant: "default",
          duration: 10000,
        });
      } else {
        toast({
          title: "Cadastro Bem-Sucedido!",
          description: "Sua conta foi criada e os detalhes do endereço foram salvos."
        });
      }
      
      redirectToStoredPathOrFallback('/');
    } else if (!authUserResult && !signUpError) {
      // Caso inesperado se signUpError for nulo.
      toast({
        title: "Erro Inesperado no Cadastro",
        description: "Ocorreu um problema durante o cadastro (código: SU_NOUSER_NOERROR_REG). Tente novamente ou contate o suporte.",
        variant: "destructive"
      });
    }

    setIsSubmitting(false);
  };


  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-background p-4">
      <Card className="w-full max-w-3xl shadow-xl">
        <form onSubmit={handleRegister}>
          <CardHeader>
            <CardTitle className="font-headline text-3xl text-center">Criar Conta</CardTitle>
            <CardDescription className="text-center">Crie uma nova conta para explorar nossos chocolates.</CardDescription>
          </CardHeader>
          <CardContent className="md:grid md:grid-cols-2 md:gap-x-8">
            {/* Coluna 1: Dados da Conta */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Senha</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="Crie uma senha (mín. 6 caracteres)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirme sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-input"
                />
              </div>
            </div>

            {/* Coluna 2: Endereço */}
            <div className="space-y-4 mt-6 md:mt-0 md:border-l md:pl-8 md:border-border/50">
              <h3 className="text-lg font-medium text-foreground pt-1">Endereço (Opcional)</h3>
              <p className="text-xs text-muted-foreground pb-2">Utilizado apenas para referência interna, não para entregas.</p>
              
              <div className="space-y-2">
                <Label htmlFor="address-street">Logradouro (Rua, Avenida)</Label>
                <Input
                  id="address-street"
                  type="text"
                  placeholder="Ex: Rua das Palmeiras"
                  value={addressStreet}
                  onChange={(e) => setAddressStreet(e.target.value)}
                  className="bg-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address-number">Número</Label>
                  <Input
                    id="address-number"
                    type="text"
                    placeholder="Ex: 123"
                    value={addressNumber}
                    onChange={(e) => setAddressNumber(e.target.value)}
                    className="bg-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address-complement">Complemento</Label>
                  <Input
                    id="address-complement"
                    type="text"
                    placeholder="Ex: Apto 101"
                    value={addressComplement}
                    onChange={(e) => setAddressComplement(e.target.value)}
                    className="bg-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address-neighborhood">Bairro</Label>
                  <Input
                    id="address-neighborhood"
                    type="text"
                    placeholder="Ex: Centro"
                    value={addressNeighborhood}
                    onChange={(e) => setAddressNeighborhood(e.target.value)}
                    className="bg-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address-city">Cidade</Label>
                  <Input
                    id="address-city"
                    type="text"
                    placeholder="Ex: São Paulo"
                    value={addressCity}
                    onChange={(e) => setAddressCity(e.target.value)}
                    className="bg-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address-state">Estado (UF)</Label>
                  <Input
                    id="address-state"
                    type="text"
                    placeholder="Ex: SP"
                    maxLength={2}
                    value={addressState}
                    onChange={(e) => setAddressState(e.target.value.toUpperCase())}
                    className="bg-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address-zip">CEP</Label>
                  <Input
                    id="address-zip"
                    type="text"
                    placeholder="Ex: 01000-000"
                    value={addressZip}
                    onChange={(e) => setAddressZip(e.target.value)}
                    className="bg-input"
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-6">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Criando...' : 'Criar Conta'}
            </Button>
            <p className="text-sm text-muted-foreground">
              Já tem uma conta?{' '}
              <Link href="/auth" className="font-medium text-primary hover:underline">
                Faça login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

    