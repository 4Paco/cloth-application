'use client';

import * as React from 'react';
import { Command, LifeBuoy, PieChart, Send, Wrench, Cog, LayoutDashboard } from 'lucide-react';

import { NavSteps } from '@/components/nav-steps';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { authClient } from '@/lib/auth-client';
import { Skeleton } from './ui/skeleton';
import { useProject } from '@/context/ProjectContext';

const data = {
    navSecondary: [
        {
            title: 'Support',
            url: '#',
            icon: LifeBuoy,
        },
        {
            title: 'Feedback',
            url: '#',
            icon: Send,
        },
    ],
    steps: [
        {
            name: 'Dashboard',
            url: '',
            icon: LayoutDashboard,
        },
        {
            name: 'Project configuration',
            url: '/configuration',
            icon: Wrench,
        },
        {
            name: 'Pattern',
            url: '/pattern',
            icon: PieChart,
        },
        {
            name: 'Preview',
            url: '/preview',
            icon: Cog,
        },
    ],
};

function ProjectsHeader() {
    const project = useProject();

    return (
        <SidebarHeader>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton size="lg" asChild>
                        {project ? (
                            <a href="/projects">
                                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                                    <Command className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">{project.name}</span>
                                    <span className="truncate text-xs">Personal</span>
                                </div>
                            </a>
                        ) : (
                            <a href="/projects">
                                <Skeleton className="flex aspect-square size-8 items-center justify-center rounded-lg" />
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <Skeleton className="h-4 mb-1" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            </a>
                        )}
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarHeader>
    );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const session = authClient.useSession();

    const hasData = session.data !== undefined && session.data !== null;
    const user = {
        name: session.data?.user.name ?? '',
        email: session.data?.user.email ?? '',
        avatar: session.data?.user.image ?? '/avatars/shadcn.jpg',
    };

    return (
        <Sidebar variant="inset" {...props}>
            <ProjectsHeader />
            <SidebarContent>
                <NavSteps steps={data.steps} />
                <NavSecondary items={data.navSecondary} className="mt-auto" />
            </SidebarContent>
            <SidebarFooter>
                {!hasData && <Skeleton className="w-full h-12" />}
                {hasData && <NavUser user={user} />}
            </SidebarFooter>
        </Sidebar>
    );
}
