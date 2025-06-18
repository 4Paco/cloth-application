'use client';

import React, { ChangeEvent, useState } from 'react';
import { parseCSVText, ColorEntry } from '../../components/color_handling'; // adjust path as needed
import { Button } from '@/components/ui/button';
import { FileIcon } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ColorTranslator } from 'colortranslator';

function ColorButton({ setParsedData }: { setParsedData: (colors: ColorEntry[]) => void }) {
    const fileSubmit = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e?.target?.files && e.target.files.length > 0) {
            const csvText = await e.target.files[0].text();
            const parsed = parseCSVText(csvText);
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

export default function ExcelTest() {
    const [parsedData, setParsedData] = useState<ColorEntry[] | null>(null);

    return (
        <div className="flex flex-col items-center justify-center min-h-dvh w-auto p-4 space-y-4">
            <div className="space-y-2">
                <h1 className="font-bold">Open your CSV file containing colors</h1>
                <div>
                    <ColorButton setParsedData={setParsedData} />
                </div>
            </div>
            {parsedData && (
                <div className="w-[75%]">
                    <Table>
                        <TableCaption>List of colors</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[10px]">Id</TableHead>
                                <TableHead>Hours</TableHead>
                                <TableHead>L</TableHead>
                                <TableHead>a</TableHead>
                                <TableHead>b</TableHead>
                                <TableHead>e</TableHead>
                                <TableHead>preview</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {parsedData.map((d, i) => {
                                const col = new ColorTranslator({ L: d.L, a: d.a, b: d.b });
                                return (
                                    <TableRow key={i}>
                                        <TableCell className="w-[10px]">{d.id}</TableCell>
                                        <TableCell>{d.hours}</TableCell>
                                        <TableCell>{d.L}</TableCell>
                                        <TableCell>{d.a}</TableCell>
                                        <TableCell>{d.b}</TableCell>
                                        <TableCell>{d.E}</TableCell>
                                        <TableCell>
                                            <div
                                                className={cn('h-[2rem] w-[2rem] rounded')}
                                                style={{ backgroundColor: col.RGB }}
                                            ></div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
