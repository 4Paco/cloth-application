'use client';

import { Project } from '@prisma/client';
import NewProjectDialog from '@/components/dialogs/new-project-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { useState, useTransition } from 'react';
import { createProject } from '@/actions/projects';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

function ProjectCard({ project }: { project: Project }) {
    const router = useRouter();
    const handleClick = function () {
        router.push('/project/' + project.id);
    };

    return (
        <Button
            variant="ghost"
            asChild
            className="aspect-square overflow-hidden cursor-pointer rounded-xl"
            onClick={handleClick}
        >
            <Card className="w-full h-full p-0 pb-4 gap-4 items-stretch">
                <CardContent className="px-0 flex-1 relative">
                    <Image src={project.thumbnail} fill className="h-auto" alt="thumbnail" />
                </CardContent>
                <CardFooter className="px-4">
                    <div className="flex flex-col">
                        <div className="font-bold">{project.name}</div>
                        <div className="text-foreground/50">Edited 3 days ago</div>
                    </div>
                </CardFooter>
            </Card>
        </Button>
    );
}

function NewProjectCard({
    handleAdd,
    isPending,
}: {
    handleAdd: (projectName: string) => void;
    isPending: boolean;
}) {
    return (
        <NewProjectDialog handleAdd={handleAdd}>
            <Button
                variant="default"
                className="aspect-square h-auto w-full cursor-pointer rounded-xl"
                disabled={isPending}
            >
                <Plus className="" />
            </Button>
        </NewProjectDialog>
    );
}
export function ProjectsList({
    userId,
    initialProjects,
}: {
    userId: string;
    initialProjects: Project[];
}) {
    const [projects, setProjects] = useState(initialProjects);
    const [isPending, startTransition] = useTransition();

    const handleAdd = (projectName: string) => {
        startTransition(async () => {
            const newProject = await createProject(projectName, userId);
            setProjects((prev) => [...prev, newProject]);
        });
    };

    return (
        <div className="grid grid-cols-6 gap-4">
            {projects.map((project, i) => (
                <ProjectCard key={i} project={project} />
            ))}
            <NewProjectCard handleAdd={handleAdd} isPending={isPending} />
        </div>
    );
}
