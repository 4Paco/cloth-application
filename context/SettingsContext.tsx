'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Settings } from '@prisma/client';
import { getSettingsByUserId } from '@/actions/user-settings';

const ProjectContext = createContext<Settings | null>(null);

export const SettingsProvider = ({
    userId,
    children,
}: {
    userId: string | undefined;
    children: React.ReactNode;
}) => {
    const [settings, setSettings] = useState<Settings | null>(null);

    useEffect(() => {
        async function fetchSettings() {
            if (userId !== undefined) {
                const data = await getSettingsByUserId(userId);
                setSettings(data);
            }
        }
        fetchSettings();
    }, [userId]);

    return <ProjectContext.Provider value={settings}>{children}</ProjectContext.Provider>;
};

export const useSettings = () => useContext(ProjectContext);
