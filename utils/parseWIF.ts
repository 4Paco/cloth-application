import { ColorTranslator, RGBObject } from 'colortranslator';

type SectionMap = Record<string, string[]>;

export type ParsedWif = {
    threading: boolean[][];
    tieup: boolean[][];
    treadling: boolean[][];
    threadsColors?: RGBObject[];
    rowsColors?: RGBObject[];
};

function parseColor(rgbStr: string): RGBObject {
    const [r, g, b] = rgbStr.split(',').map((n) => +n / 999);
    return new ColorTranslator({ R: 255 * r, G: 255 * g, B: 255 * b }, { rgbUnit: 'none' })
        .RGBObject;
}

export function parseWifFile(content: string): ParsedWif {
    const lines = content.split(/\r?\n/);
    const sections: SectionMap = {};
    let currentSection = '';

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            currentSection = trimmed.slice(1, -1).toUpperCase();
            sections[currentSection] = [];
        } else if (currentSection) {
            sections[currentSection].push(trimmed);
        }
    }

    const threading: boolean[][] = [];
    const tieup: boolean[][] = [];
    const treadling: boolean[][] = [];
    const colorTable: Record<number, RGBObject> = {};

    // Parse color table
    for (const line of sections['COLOR TABLE'] || []) {
        const [indexStr, rgbStr] = line.split('=');
        const index = +indexStr;
        colorTable[index] = parseColor(rgbStr);
    }

    // Parse threading
    const threadingRaw = sections['THREADING'] || [];
    const maxThread = Math.max(...threadingRaw.map((l) => +l.split('=')[0]));
    const maxShaft = Math.max(...threadingRaw.map((l) => +l.split('=')[1]));
    for (let i = 0; i < maxShaft; i++) threading[i] = Array(maxThread).fill(false);

    for (const line of threadingRaw) {
        const [colStr, shaftStr] = line.split('=');
        const col = +colStr - 1;
        const shaft = +shaftStr - 1;
        if (threading[shaft]) threading[shaft][col] = true;
    }

    // Parse tie-up
    const tieupRaw = sections['TIEUP'] || [];
    const nTreadles = Math.max(...tieupRaw.map((l) => +l.split('=')[0]));
    const nFrames = maxShaft;
    for (let i = 0; i < nFrames; i++) tieup[i] = Array(nTreadles).fill(false);

    for (const line of tieupRaw) {
        const [treadleStr, shaftsStr] = line.split('=');
        const treadle = +treadleStr - 1;
        const shafts = shaftsStr.split(',').map((s) => +s - 1);
        for (const shaft of shafts) {
            tieup[shaft][treadle] = true;
        }
    }

    // Parse treadling
    const treadlingRaw = sections['TREADLING'] || [];
    const maxPicks = Math.max(...treadlingRaw.map((l) => +l.split('=')[0]));
    for (let i = 0; i < maxPicks; i++) {
        treadling[i] = Array(nTreadles).fill(false);
    }

    for (const line of treadlingRaw) {
        const [rowStr, treadleStr] = line.split('=');
        const row = +rowStr - 1;
        const treadle = +treadleStr - 1;
        treadling[row][treadle] = true;
    }

    // Parse colors (optional)
    const warpColors = sections['WARP COLORS'] || [];
    const weftColors = sections['WEFT COLORS'] || [];

    const threadsColors: RGBObject[] = [];
    const rowsColors: RGBObject[] = [];

    const warpMap: Record<number, number> = {};
    for (const line of warpColors) {
        const [colStr, colorIdxStr] = line.split('=');
        warpMap[+colStr - 1] = +colorIdxStr;
    }

    const weftMap: Record<number, number> = {};
    for (const line of weftColors) {
        const [rowStr, colorIdxStr] = line.split('=');
        weftMap[+rowStr - 1] = +colorIdxStr;
    }

    const threadingCols = threading[0]?.length ?? 0;
    for (let i = 0; i < threadingCols; i++) {
        const color =
            colorTable[warpMap[i]] || new ColorTranslator({ R: 255, G: 0, B: 0 }).RGBObject;
        threadsColors[i] = color;
    }

    for (let i = 0; i < treadling.length; i++) {
        const color =
            colorTable[weftMap[i]] || new ColorTranslator({ R: 255, G: 0, B: 0 }).RGBObject;
        rowsColors[i] = color;
    }

    return {
        threading,
        tieup,
        treadling,
        threadsColors,
        rowsColors,
    };
}
