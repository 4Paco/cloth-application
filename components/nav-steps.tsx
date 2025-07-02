'use client';

import { type LucideIcon } from 'lucide-react';

import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import { useProject } from '@/context/ProjectContext';
import Link from 'next/link';

export function NavSteps({
    steps,
}: {
    steps: {
        name: string;
        url: string;
        icon: LucideIcon;
    }[];
}) {
    const pathname = usePathname();
    const project = useProject();

    return (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Steps</SidebarGroupLabel>
            <SidebarMenu>
                {steps.map((item) => {
                    const url = '/project/' + project?.id + item.url;
                    const selected = pathname.endsWith(url);

                    return (
                        <SidebarMenuItem key={item.name}>
                            <SidebarMenuButton asChild isActive={selected}>
                                <Link href={url}>
                                    <item.icon />
                                    <span>{item.name}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
