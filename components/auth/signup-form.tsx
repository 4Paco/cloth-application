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

export function SignupForm({ className, ...props }: React.ComponentProps<'div'>) {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    function handleSignup(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        setError('');
        authClient.signUp.email(
            {
                email, // user email address
                password, // user password -> min 8 characters by default
                name, // user display name
            },
            {
                onSuccess: (ctx) => {
                    console.log('success', ctx.data);
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
                    <form className="p-6 md:p-8" onSubmit={handleSignup}>
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col items-start text-left">
                                <h1 className="text-2xl font-bold">Créer un compte</h1>
                                <p className="text-muted-foreground text-sm">
                                    Inscrivez-vous pour commencer vos projets
                                </p>
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
                                <Label htmlFor="email">Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
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

                            <div className="grid gap-3">
                                <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>

                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                            <Button type="submit" className="w-full">
                                Créer un compte
                            </Button>

                            <div className="text-center text-sm">
                                Vous avez déjà un compte ?{' '}
                                <a href="/login" className="underline underline-offset-4">
                                    Se connecter
                                </a>
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

export default SignupForm;
