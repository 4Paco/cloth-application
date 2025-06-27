import { DesignProgression } from '@/components/navigation/DesignProgression';

export default function Layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex flex-col">
            <DesignProgression />
            {children}
        </div>
    );
}
