import { DobbyPatternEditor } from '@/components/patterns/DobbyPatternEditor';
import { parseWifFile } from '@/utils/parseWIF';
import { readFileSync } from 'fs';
import path from 'path';

export default async function Page() {
    const filePath = path.join(process.cwd(), 'public/hearts3.wif');
    const wifText = readFileSync(filePath, 'utf-8');

    const { threading, tieup, treadling, threadsColors, rowsColors } = parseWifFile(wifText);

    return (
        <DobbyPatternEditor
            threadsCount={threadsColors?.length || 4}
            treadlesCount={treadling[0].length}
            framesCount={threading.length}
            rowsCount={rowsColors?.length || 4}
            // initialThreadsColors={threadsColors}
            // initialRowsColors={rowsColors}
            initialThreads={threading}
            initialTieup={tieup}
            initialTreadling={treadling}
        />
    );
}
