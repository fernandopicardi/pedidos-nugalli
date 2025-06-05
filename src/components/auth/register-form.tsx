
"use client";

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp, getUser } from '@/lib/auth'; // Importar signUp e getUser do serviço de autenticação

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

    // Chamar a função signUp do serviço de autenticação
    const { user: registeredUser, error: signUpError } = await signUp(email, password, {
 addressStreet,
      addressNumber,
 addressComplement,
 addressNeighborhood,
 addressCity,
 addressState,
 addressZip,
    });

    if (signUpError) {
      setIsSubmitting(false);
      return;
    }

    // Se signUpAuthData.user existir mas signUpAuthData.session for null,
    // significa que a confirmação de email é necessária (se habilitada no Supabase).
    if (signUpAuthData.user && !signUpAuthData.session) {
      toast({ title: "Verifique seu Email", description: "Um link de confirmação foi enviado. Por favor, ative sua conta para continuar.", duration: 9000 });
      router.push('/auth'); // Redirecionar para a página de login
      setIsSubmitting(false);
      return;
    }

    // Se chegou aqui, o cadastro foi bem-sucedido e o usuário foi criado (e o perfil também, pela função signUp)
    if (registeredUser) {
      toast({ title: "Cadastro Bem-Sucedido", description: "Sua conta foi criada com sucesso!" });
      // Se a confirmação de email não for necessária e o usuário estiver logado após signUp
      if (signUpAuthData.session) {
        // O perfil já foi criado dentro do signUp, então apenas buscamos o usuário completo
        await getUser(); // Isso deve buscar o usuário completo (com perfil) e atualizar o localStorage.
        redirectToStoredPathOrFallback('/');
      } else {
        // Confirmação de email necessária
        router.push('/auth'); // Redirecionar para a página de login para esperar confirmação
      }
    } else if (signUpAuthData.user && !signUpAuthData.session) {
      // Este bloco já foi tratado acima, mas como uma rede de segurança.
       toast({
        title: "Verifique seu Email",
        description: "Um link de confirmação foi enviado. Por favor, ative sua conta para continuar.",
        duration: 9000,
      });
      router.push('/auth');
    } else {
      // Caso muito improvável: signUp bem-sucedido sem erro, mas sem usuário.
      toast({ title: "Erro Inesperado no Cadastro", description: "Ocorreu um problema durante o cadastro. Tente novamente.", variant: "destructive" });
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
    

    