// app/project/[projectId]/layout.tsx

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ProjectProvider } from '@/context/ProjectContext';

export default async function ProjectLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ projectId: string }>;
}) {
    const projectId = (await params).projectId;

    return (
        <ProjectProvider projectId={projectId}>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>{children}</SidebarInset>
            </SidebarProvider>
        </ProjectProvider>
    );
}
