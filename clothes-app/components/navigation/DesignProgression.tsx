'use client';

import { usePathname } from 'next/navigation';

const steps = ['/app/configuration', '/app/pattern', '/app/', '/step4'];

export function DesignProgression() {
    const pathname = usePathname();
    const currentIndex = steps.indexOf(pathname);
    const progressPercent = ((currentIndex + 1) / steps.length) * 100;

    if (currentIndex === -1) return null; // Not a step page

    return (
        <div className="w-full h-2 bg-gray-200">
            <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
            />
        </div>
    );
}
