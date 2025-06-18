// app/signup/page.tsx

import { SignupForm } from '@/components/signup-form';

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4">
      <SignupForm />
    </main>
  );
}
