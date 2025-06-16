// app/reset-password/page.tsx
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 👇 ici tu devrais appeler ton backend ou ton système d'authentification
    console.log('Email de réinitialisation envoyé à :', email);

    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white px-4">
      <div className="bg-white dark:bg-gray-900 text-black dark:text-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">Mot de passe oublié</h1>
        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse e-mail</Label>
              <Input
                type="email"
                id="email"
                placeholder="votre@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              Envoyer le lien de réinitialisation
            </Button>
          </form>
        ) : (
          <p className="text-center">Un lien a été envoyé à votre adresse e-mail.</p>
        )}
        <div className="text-center mt-6">
          <Button variant="link" onClick={() => router.push('/login')}>
            Retour à la connexion
          </Button>
        </div>
      </div>
    </div>
  );
}
