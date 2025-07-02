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
            deleted: false,
        },
        orderBy: {
            lastOpenDate: 'desc',
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

export async function deleteProject(projectId: string) {
    await prisma.project.update({
        where: {
            id: projectId,
        },
        data: {
            deleted: true,
        },
    });
}

export async function setFavorite(projectId: string, favorite: boolean) {
    await prisma.project.update({
        where: {
            id: projectId,
        },
        data: {
            favorite,
        },
    });
}
