'use server';

import { prisma } from '@/lib/prisma';

export async function getSettingsByUserId(userId: string) {
    return await prisma.settings.findFirst({
        where: {
            userId,
        },
    });
}

export async function createUserDefaultSettings(userId: string) {
    console.log("creating default settings for", userId);
    prisma.settings.upsert({
        create: { userId },
        update: {},
        where: {
            userId,
        },
    });
}
