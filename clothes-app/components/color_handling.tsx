import * as XLSX from 'xlsx';

export interface ColorEntry {
    id: number;
    hours: number;
    L: number;
    a: number;
    b: number;
    E: number;
}

export function parseCSVText(csvText: string): ColorEntry[] {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');

    return lines.slice(1).map((line) => {
        const values = line.split(',');
        const entry: any = {};

        headers.forEach((header, i) => {
            entry[header.trim()] = values[i].trim();
        });

        return {
            id: Number(entry.id),
            hours: Number(entry.hours),
            L: Number(entry.L),
            a: Number(entry.a),
            b: Number(entry.b),
            E: Number(entry.E),
        };
    });
}

export function get_individual_colors(
    // Returns all the colors at their initial state, before any exposure to sunlight
    colors: ColorEntry[]
): ColorEntry[] {
    return colors.filter((color) => color.hours === 0);
}
