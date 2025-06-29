'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { useState } from 'react';
import pigments from '@/public/pigments.jpg';
import { authClient } from '@/lib/auth-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const router = useRouter();

    function handleSignin(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        setError('');
        authClient.signIn.email(
            {
                email,
                password,
            },
            {
                onSuccess: () => {
                    router.replace('/projects');
                },
                onError: (ctx) => {
                    setError(ctx.error.message);
                },
            }
        );
    }

    return (
        <div className={cn('flex flex-col gap-6', className)} {...props}>
            <Card className="overflow-hidden p-0">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <form className="p-6 md:p-8" onSubmit={handleSignin}>
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col items-start text-left">
                                <h1 className="text-2xl font-bold">Se connecter</h1>
                            </div>

                            <div className="grid gap-3">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="grid gap-3">
                                <Label htmlFor="password">Mot de passe</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                            <Button type="submit" className="w-full">
                                Se connecter
                            </Button>

                            <div className="text-center text-sm">
                                Vous avez déjà un compte ?{' '}
                                <Link href="/auth/signup" className="underline underline-offset-4">
                                    Créer un compte
                                </Link>
                            </div>
                        </div>
                    </form>

                    <div className="bg-muted relative hidden md:block">
                        <Image
                            src={pigments}
                            alt="Image"
                            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="text-muted-foreground text-center text-xs *:[a]:underline *:[a]:underline-offset-4">
                En vous inscrivant, vous acceptez nos <a href="#">Conditions</a> et notre{' '}
                <a href="#">Politique de confidentialité</a>.
            </div>
        </div>
    );
}

export default LoginForm;
