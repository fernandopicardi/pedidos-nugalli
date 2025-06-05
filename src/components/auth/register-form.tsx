
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
import { updateUserDetails, getCurrentUser } from '@/lib/supabasePlaceholders'; // getCurrentUser is for client-side state update

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

    // Call signUp from auth.ts. It passes address data to options.data for triggers.
    // displayName and whatsapp are not on this form, so signUp will use defaults.
    const { user: registeredUser, session: signUpSession, error: signUpError } = await signUp(email, password, {
      // Not passing displayName or whatsapp explicitly here;
      // auth.ts's signUp will use defaults (e.g., email prefix for displayName)
      // if they are not provided in this profileData object.
      // The primary purpose of passing profileData here is for address fields
      // to be included in Supabase auth user_metadata for triggers.
      addressStreet,
      addressNumber,
      addressComplement,
      addressNeighborhood,
      addressCity,
      addressState,
      addressZip,
    });

    if (signUpError) {
      toast({ title: "Erro no Cadastro", description: signUpError.message, variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    if (registeredUser && !signUpSession) {
      // Email confirmation required
      toast({
        title: "Verifique seu Email",
        description: "Um link de confirmação foi enviado. Por favor, ative sua conta para continuar.",
        duration: 9000, // Longer duration for this important message
      });
      router.push('/auth'); // Redirect to login page to await confirmation
      setIsSubmitting(false);
      return;
    }

    if (registeredUser && signUpSession) {
      // User is signed up AND has a session (e.g., email confirmation disabled or auto-confirmed)
      // Now, explicitly update the profile in 'profiles' table with address details.
      try {
        const { error: updateError } = await updateUserDetails(registeredUser.id, {
          // displayName and whatsapp were set via options.data in signUp if a trigger used them.
          // This call primarily ensures address details from the form are saved.
          addressStreet,
          addressNumber,
          addressComplement,
          addressNeighborhood,
          addressCity,
          addressState,
          addressZip,
        });

        if (updateError) {
          // Log the error for debugging, but still inform user of partial success
          console.error("Error updating profile details after signup:", updateError.message);
          toast({
            title: "Cadastro Concluído com Avisos",
            description: `Sua conta foi criada, mas houve um erro ao salvar os detalhes do endereço: ${updateError.message}. Você pode tentar atualizá-los mais tarde na sua página de conta.`,
            variant: "default", // Not "destructive" as account is created
            duration: 10000,
          });
        } else {
          toast({
            title: "Cadastro Bem-Sucedido!",
            description: "Sua conta foi criada e os detalhes do endereço foram salvos."
          });
        }
        
        await getCurrentUser(); // Ensure client-side user state/localStorage is updated with the full profile
        redirectToStoredPathOrFallback('/');

      } catch (e: any) {
        // Catch any unexpected errors during the profile update or redirect
        console.error("Unexpected error during post-signup profile update:", e.message);
        toast({
          title: "Erro Pós-Cadastro",
          description: `Sua conta foi criada, mas houve um erro inesperado ao salvar os detalhes do perfil: ${e.message}. Por favor, verifique seus dados na página da conta.`,
          variant: "destructive",
          duration: 10000,
        });
        // Still redirect, as the user account itself was created
        redirectToStoredPathOrFallback('/'); 
      }
    } else if (!registeredUser && !signUpError) {
      // This case should ideally not happen if signUpError is null.
      // It implies signUp was successful but returned no user, which is unusual.
      toast({
        title: "Erro Inesperado no Cadastro",
        description: "Ocorreu um problema durante o cadastro (código: SU_NOUSER_NOERROR). Tente novamente ou contate o suporte.",
        variant: "destructive"
      });
    }
    // If signUpError was present, it's handled above.
    // If registeredUser and signUpSession logic leads to a redirect, this is fine.

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
