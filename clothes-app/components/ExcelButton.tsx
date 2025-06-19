'use client';
import React, { ChangeEvent, useState } from 'react';

import { FileIcon } from 'lucide-react';
import { parseCSVText, ColorEntry } from './color_handling'; // adjust path as needed
import { Button } from '@/components/ui/button';

export function ColorButton({ setParsedData }: { setParsedData: (colors: ColorEntry[]) => void }) {
    const fileSubmit = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e?.target?.files && e.target.files.length > 0) {
            const csvText = await e.target.files[0].text();
            const parsed = parseCSVText(csvText);
            console.log('tableau_test: ', parsed[0]);
            setParsedData(parsed);
        }
    };

    return (
        <>
            <Button variant="outline" asChild>
                <label htmlFor="file-upload" className="cursor-pointer">
                    <FileIcon /> Open File
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
