
"use client";

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { signInWithEmail, signUpWithEmail } from '@/lib/supabasePlaceholders';
import { useToast } from '@/hooks/use-toast';
import { updateUserDetails } from '@/lib/supabasePlaceholders'; // Rewritten import
import { useRouter } from 'next/navigation';

export function AuthForm() {
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

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    const { error } = await signInWithEmail(email, password);
    if (error) {
      toast({ title: "Erro no Login", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Login Bem-Sucedido", description: "Bem-vindo de volta!" });
      redirectToStoredPathOrFallback('/');
    }
    setIsSubmitting(false);
  };

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {

      toast({ title: "Erro no Cadastro", description: "As senhas não coincidem.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    // Attempt to sign up the user first
    const { error, user } = await signUpWithEmail(email, password);

    if (error) {
      toast({ title: "Erro no Cadastro", description: error.message, variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    // If signup is successful, attempt to log in the new user
    const loginResult = await signInWithEmail(email, password); // Auto-login the newly created user

    if (loginResult.error) {
      // If auto-login fails, redirect to auth page
      toast({ title: "Erro no Login Automático", description: loginResult.error.message, variant: "destructive" });
      redirectToStoredPathOrFallback('/auth');
    } else if (loginResult.user) {
      // If auto-login is successful, update the user's profile with address data
      const updateResult = await updateUserDetails(loginResult.user.userId, {
 addressStreet,
 addressNumber,
 addressComplement,
        addressNeighborhood, addressCity, addressState, addressZip
      });

 toast({ title: "Cadastro Bem-Sucedido", description: "Sua conta foi criada." });
    } else {
       // This case should ideally not be reached if signup was successful
      }
    setIsSubmitting(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Tabs defaultValue="login" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Entrar</TabsTrigger>
          <TabsTrigger value="register">Criar Conta</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-3xl text-center">Entrar</CardTitle>
              <CardDescription className="text-center">Acesse sua conta para continuar.</CardDescription>
            </CardHeader>
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-input"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Entrando...' : 'Entrar'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        <TabsContent value="register">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-3xl text-center">Criar Conta</CardTitle>
              <CardDescription className="text-center">Crie uma nova conta para explorar nossos chocolates.</CardDescription>
            </CardHeader>
            <form onSubmit={handleRegister}>
              <CardContent className="space-y-6">
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
                    placeholder="Crie uma senha"
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
                 {/* Address Fields - Optional */}
                <div className="space-y-2">
                  <Label htmlFor="address-street">Rua (Opcional)</Label>
                  <Input
                    id="address-street"
                    type="text"
                    placeholder="Rua, Avenida, Travessa..."
                    value={addressStreet}
                    onChange={(e) => setAddressStreet(e.target.value)}
                    className="bg-input"
                  />
                </div>
               <div className="space-y-2">
                  <Label htmlFor="address-number">Número (Opcional)</Label>
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
                  <Label htmlFor="address-complement">Complemento (Opcional)</Label>
                  <Input
                    id="address-complement"
                    type="text"
                    placeholder="Apartamento, Bloco, Casa..."
                    value={addressComplement}
                    onChange={(e) => setAddressComplement(e.target.value)}
                    className="bg-input"
                  />
                </div>
               <div className="space-y-2">
                  <Label htmlFor="address-neighborhood">Bairro (Opcional)</Label>
                  <Input
                    id="address-neighborhood"
                    type="text"
                    placeholder="Seu bairro"
                    value={addressNeighborhood}
                    onChange={(e) => setAddressNeighborhood(e.target.value)}
                    className="bg-input"
                  />
                </div>
               <div className="space-y-2">
                  <Label htmlFor="address-city">Cidade (Opcional)</Label>
                  <Input
                    id="address-city"
                    type="text"
                    placeholder="Sua cidade"
                    value={addressCity}
                    onChange={(e) => setAddressCity(e.target.value)}
                    className="bg-input"
                  />
                </div>
               <div className="space-y-2">
                  <Label htmlFor="address-state">Estado (Opcional)</Label>
                  <Input
                    id="address-state"
                    type="text"
                    placeholder="Seu estado (UF)"
                    value={addressState}
                    onChange={(e) => setAddressState(e.target.value)}
                    className="bg-input"
                  />
                </div>
               <div className="space-y-2">
                  <Label htmlFor="address-zip">CEP (Opcional)</Label>
                  <Input
                    id="address-zip"
                    type="text"
                    placeholder="00000-000"
                    value={addressZip}
                    onChange={(e) => setAddressZip(e.target.value)}
                    className="bg-input"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Criando...' : 'Criar Conta'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
