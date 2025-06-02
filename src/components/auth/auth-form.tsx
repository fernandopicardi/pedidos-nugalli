
"use client";

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { signInWithEmail, signUpWithEmail } from '@/lib/supabasePlaceholders';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

export function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    const { error } = await signInWithEmail(email, password);
    if (error) {
      toast({ title: "Erro no Login", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Login Bem-Sucedido", description: "Bem-vindo de volta!" });
      router.push('/'); // Redirect after login
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
    const { error, user } = await signUpWithEmail(email, password);
    if (error) {
      toast({ title: "Erro no Cadastro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Cadastro Bem-Sucedido", description: "Sua conta foi criada. Você será redirecionado." });
      // Attempt to log in the new user automatically for redirection
      const loginResult = await signInWithEmail(email, password);
      if (loginResult.error) {
        router.push('/auth'); // Fallback to auth page if auto-login fails
      } else {
        router.push('/'); // Redirect after successful registration and auto-login
      }
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
