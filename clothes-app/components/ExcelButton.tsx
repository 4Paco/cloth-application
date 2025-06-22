'use client';
import React, { ChangeEvent } from 'react';

import { Button } from '@/components/ui/button';

export function ColorButton({
    children,
    callback,
}: {
    children: React.ReactNode;
    callback: (file: File) => void;
}) {
    const fileSubmit = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e?.target?.files && e.target.files.length > 0) {
            callback(e.target.files[0]);
        }
    };

    return (
        <>
            <Button asChild>
                <label htmlFor="file-upload" className="cursor-pointer">
                    {children}
                </label>
            </Button>
            <input
                id="file-upload"
                type="file"
                className="absolute inset-0 opacity-0 pointer-events-none"
                onChange={fileSubmit}
            />
        </>
    );
}
