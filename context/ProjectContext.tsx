'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getProjectById } from '@/actions/projects';
import { Project } from '@prisma/client';

const ProjectContext = createContext<Project | null>(null);

export const ProjectProvider = ({
    projectId,
    children,
}: {
    projectId: string;
    children: React.ReactNode;
}) => {
    const [project, setProject] = useState<Project | null>(null);

    useEffect(() => {
        async function fetchProject() {
            const data = await getProjectById(projectId);
            setProject(data);
        }
        fetchProject();
    }, [projectId]);

    return <ProjectContext.Provider value={project}>{children}</ProjectContext.Provider>;
};

export const useProject = () => useContext(ProjectContext);
