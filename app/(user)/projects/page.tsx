import { getUserPojects } from '@/actions/projects';
import { ProjectsList } from '@/components/projects/ProjectsList';
import { auth } from '@/lib/auth';
import { getTranslations } from 'next-intl/server';
import { headers } from 'next/headers';

export default async function Page() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const projects = session?.user ? await getUserPojects(session.user.id) : [];

    const t = await getTranslations('Projects');

    return (
        <div className="h-dvh flex place-items-center justify-center">
            <div className="flex flex-col w-2/3 space-y-6">
                <h1 className=" font-bold text-3xl">{t('headline')}</h1>
                {session?.user && (
                    <ProjectsList userId={session.user.id} initialProjects={projects} />
                )}
            </div>
        </div>
    );
}
