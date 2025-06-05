
"use client";

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { User } from '@/types';
import { signInWithEmail, getCurrentUser } from '@/lib/supabasePlaceholders'; // Added import

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

    // Usar a função signInWithEmail de supabasePlaceholders
    const { user, error } = await signInWithEmail(email, password);

    if (error || !user) {
      toast({
        title: "Erro no Login",
        description: error?.message || "Ocorreu um erro desconhecido.",
        variant: "destructive"
      });
    } else {
      toast({ title: "Login Bem-Sucedido", description: "Bem-vindo de volta!" });
      // getCurrentUser() aqui pode ser redundante se signInWithEmail já atualiza o localStorage
      // e o Header reage ao onAuthStateChange. Mas não prejudica.
      await getCurrentUser(); 
      redirectToStoredPathOrFallback('/');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
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
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
            <p className="text-sm text-muted-foreground">
              Não tem uma conta?{' '}
              <Link href="/auth/register" className="font-medium text-primary hover:underline">
                Cadastre-se
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
