
"use client";

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { signUpWithEmail, updateUserDetails, signInWithEmail } from '@/lib/supabasePlaceholders';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

    const { error: signUpError, user: signedUpUser } = await signUpWithEmail(email, password);

    if (signUpError) {
      toast({ title: "Erro no Cadastro", description: signUpError.message, variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    
    // If sign up is successful, Supabase often auto-signs in the user or sends a confirmation email.
    // For this flow, we'll assume auto-signin or proceed to sign in manually to get a session.
    // Then update details.

    // Attempt to sign in the new user to get a session, then update details
    const { user: loggedInUser, error: signInError } = await signInWithEmail(email, password);

    if (signInError || !loggedInUser) {
      toast({ title: "Erro no Login Pós-Cadastro", description: signInError?.message || "Não foi possível logar após o cadastro.", variant: "destructive" });
      // Potentially redirect to login or show message to check email if confirmation is required
      router.push('/auth'); 
      setIsSubmitting(false);
      return;
    }

    // Now update the user details with the address.
    // Use loggedInUser.userId which should be the same as signedUpUser.userId if the flow is correct.
    const { error: updateError } = await updateUserDetails(loggedInUser.userId, {
      // displayName will be set by default in signUpWithEmail or can be added as a field
      addressStreet,
      addressNumber,
      addressComplement,
      addressNeighborhood,
      addressCity,
      addressState,
      addressZip,
    });

    if (updateError) {
      // User is created and logged in, but address update failed.
      // Inform the user, they can update it later from their account page.
      toast({ title: "Cadastro Concluído com Alerta", description: `Sua conta foi criada, mas houve um erro ao salvar o endereço: ${updateError.message}. Você pode atualizá-lo em "Minha Conta".`, variant: "default" });
    } else {
      toast({ title: "Cadastro Bem-Sucedido", description: "Sua conta foi criada e o endereço salvo." });
    }
    
    redirectToStoredPathOrFallback('/');
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
