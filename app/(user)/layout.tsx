import { SettingsProvider } from '@/context/SettingsContext';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export default async function ProjectLayout({ children }: { children: React.ReactNode }) {
    const userId = await auth.api.getSession({
        headers: await headers(),
    });

    return <SettingsProvider userId={userId?.user.id}>{children}</SettingsProvider>;
}
