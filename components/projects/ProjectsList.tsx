'use client';

import { Project } from '@prisma/client';
import NewProjectDialog from '@/components/dialogs/new-project-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { useState, useTransition } from 'react';
import { createProject } from '@/actions/projects';

function ProjectCard({ project }: { project: Project }) {
    return (
        <Card className="aspect-square">
            <CardHeader>{project.name}</CardHeader>
        </Card>
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
                className="aspect-square h-auto w-full cursor-pointer"
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
