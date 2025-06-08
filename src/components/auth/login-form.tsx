
"use client";

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// import type { User } from '@/types'; // User type is implicitly handled by signInWithEmail return
import { signInWithEmail } from '@/lib/auth'; // signInWithEmail from auth.ts should handle profile fetching
import { Loader2 } from 'lucide-react'; // Import Loader2

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
    // Ensure router.replace or router.refresh if needed for full state update on redirect
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      // signInWithEmail from lib/auth.ts should handle fetching the user profile data.
      const { user, error } = await signInWithEmail(email, password);

      if (error || !user) {
        toast({
          title: "Erro no Login",
          description: error?.message || "Ocorreu um erro desconhecido durante o login.",
          variant: "destructive"
        });
      } else {
        toast({ title: "Login Bem-Sucedido", description: "Bem-vindo de volta!" });
        // The user object from signInWithEmail should be the full profile.
        // The Header component should react to auth state changes to update its display.
        redirectToStoredPathOrFallback(user.isAdmin ? '/admin' : '/'); // Redirect to admin if admin
      }
    } catch (e: any) {
      // Catch any unexpected errors from signInWithEmail or redirectToStoredPathOrFallback
      console.error("Unexpected error in handleLogin:", e);
      toast({
        title: "Erro Inesperado",
        description: e.message || "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
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
