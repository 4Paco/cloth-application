'use client';

import { Project } from '@prisma/client';
import NewProjectDialog from '@/components/dialogs/new-project-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardFooter } from '@/components/ui/card';
import { Plus, Star, Trash } from 'lucide-react';
import { useMemo, useState, useTransition } from 'react';
import { createProject, deleteProject, setFavorite } from '@/actions/projects';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { differenceInCalendarDays, formatDistanceToNow } from 'date-fns';
import { fr, enGB } from 'date-fns/locale';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';

function ProjectCardStar({
    filled,
    onClick,
    disabled,
}: {
    filled: boolean;
    onClick: () => void;
    disabled: boolean;
}) {
    return (
        <Button variant="ghost" className="cursor-pointer" onClick={onClick} disabled={disabled}>
            <Star className={cn(filled && 'fill-yellow-300')} />
        </Button>
    );
}

function ProjectCardDelete({ onClick }: { onClick: () => void }) {
    return (
        <Button variant="ghost" className="cursor-pointer" onClick={onClick}>
            <Trash className="" />
        </Button>
    );
}

function ProjectCard({
    initialProject,
    handleRemove,
}: {
    initialProject: Project;
    handleRemove: (projectId: string) => void;
}) {
    const router = useRouter();
    const handleClick = function () {
        router.push('/project/' + initialProject.id);
    };

    const [project, setProject] = useState(initialProject);
    const [isPending, startTransition] = useTransition();

    const toggleFavorite = () => {
        startTransition(async () => {
            await setFavorite(project.id, !project.favorite);
            setProject((prev) => {
                return {
                    ...prev,
                    favorite: !prev.favorite,
                };
            });
        });
    };

    const onClickRemove = () => {
        handleRemove(project.id);
    };

    const locale = useLocale();

    const t = useTranslations('Projects');

    const lastEdited = formatDistanceToNow(new Date(project.lastOpenDate), {
        addSuffix: true,
        locale: locale == 'fr' ? fr : enGB,
    });

    return (
        <Card className="relative aspect-square w-full h-full overflow-hidden rounded-xl shadow-lg">
            <Button
                variant="ghost"
                asChild
                className="overflow-hidden cursor-pointer rounded-xl object-cover z-0 p-0"
                onClick={handleClick}
            >
                <Image src={project.thumbnail} fill alt="Project thumbnail" />
            </Button>

            {/* Dark overlay */}
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black to-transparent pointer-events-none" />

            <div className="absolute top-2 right-2 z-20 flex -gap-2 pointer-events-none">
                <ProjectCardStar
                    filled={project.favorite}
                    onClick={toggleFavorite}
                    disabled={isPending}
                />
                <ProjectCardDelete onClick={onClickRemove} />
            </div>

            <CardFooter className="absolute bottom-0 left-0 right-0 z-20 p-4 text-white pointer-events-none">
                <div>
                    <div className="font-bold text-lg">{project.name}</div>
                    <div className="text-xs opacity-75">
                        {t('edited')} {lastEdited}
                    </div>
                </div>
            </CardFooter>
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
                className="aspect-square h-auto w-full cursor-pointer rounded-xl"
                disabled={isPending}
            >
                <Plus className="" />
            </Button>
        </NewProjectDialog>
    );
}

type ProjectFilter = {
    id: string;
    name: string;
    active: boolean;
    func: (project: Project) => boolean;
};

const filterDefinitions: Record<string, ProjectFilter> = {
    favorites: {
        id: 'favorites',
        name: 'favorites',
        active: false,
        func: (project: Project) => {
            return project.favorite;
        },
    },
    recents: {
        id: 'recents',
        name: 'recents',
        active: false,
        func: (project: Project) => {
            return differenceInCalendarDays(new Date(), project.lastOpenDate) < 8;
        },
    },
};

export function ProjectsList({
    userId,
    initialProjects,
}: {
    userId: string;
    initialProjects: Project[];
}) {
    const [projects, setProjects] = useState(initialProjects);
    const [isPending, startTransition] = useTransition();

    const [activeFilters, setActiveFilters] = useState<string[]>([]);

    const handleAdd = (projectName: string) => {
        startTransition(async () => {
            const newProject = await createProject(projectName, userId);
            setProjects((prev) => [...prev, newProject]);
        });
    };

    const handleRemove = (projectId: string) => {
        startTransition(async () => {
            await deleteProject(projectId);
            setProjects((prev) => prev.filter((p) => p.id != projectId));
        });
    };

    const filteredProjects = useMemo(() => {
        return projects.filter((project) =>
            activeFilters.map((id) => filterDefinitions[id].func).every((fn) => fn(project))
        );
    }, [activeFilters, projects]);

    const toggleFilter = (filterId: string) => {
        setActiveFilters((prev) =>
            prev.includes(filterId) ? prev.filter((id) => id !== filterId) : [...prev, filterId]
        );
    };

    return (
        <div className="flex flex-col space-y-2">
            <div className="flex flex-row space-x-2">
                {Object.values(filterDefinitions).map((filter) => (
                    <Badge
                        key={filter.id}
                        variant={activeFilters.includes(filter.id) ? 'default' : 'secondary'}
                        className="select-none cursor-pointer"
                        onClick={() => toggleFilter(filter.id)}
                    >
                        {filter.name}
                    </Badge>
                ))}{' '}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredProjects.map((project) => (
                    <ProjectCard
                        key={project.id}
                        initialProject={project}
                        handleRemove={handleRemove}
                    />
                ))}
                <NewProjectCard handleAdd={handleAdd} isPending={isPending} />
            </div>
        </div>
    );
}
