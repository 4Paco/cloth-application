import { getUserPojects } from '@/actions/projects';
import { ProjectsList } from '@/components/projects/ProjectsList';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export default async function Page() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const projects = session?.user ? await getUserPojects(session.user.id) : [];

    return (
        <div className="h-dvh flex place-items-center justify-center">
            <div className="flex flex-col w-2/3 space-y-4">
                <h1 className=" font-bold text-3xl">Your projects</h1>
                {session?.user && (
                    <ProjectsList userId={session.user.id} initialProjects={projects} />
                )}
            </div>
        </div>
    );
}
