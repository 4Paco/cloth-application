'use server';

import { prisma } from '@/lib/prisma';

export async function getProjectById(projectId: string) {
    return await prisma.project.findUnique({
        where: {
            id: projectId,
        },
    });
}

export async function getUserPojects(userId: string) {
    return await prisma.project.findMany({
        where: {
            ownerId: userId,
        },
    });
}

export async function createProject(projectName: string, ownerId: string) {
    return await prisma.project.create({
        data: {
            name: projectName,
            ownerId: ownerId,
        },
    });
}
