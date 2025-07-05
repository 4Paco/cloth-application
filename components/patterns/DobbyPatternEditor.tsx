'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Canvas, { CanvasHandle } from '@/components/canvas/Canvas';
import { cn } from '@/lib/utils';
import niceColors from 'nice-color-palettes';
import { ColorTranslator, RGBObject } from 'colortranslator';

function BitmapCanvas({
    bitmap,
    onPointerDown,
    pixelSize,
    className,
}: {
    bitmap: Array<Array<boolean>>;
    onPointerDown: (event: PointerEvent) => void;
    pixelSize: number;
    className?: string;
}) {
    const canvasRef = useRef<CanvasHandle>(null);

    const continuousDraw = useCallback(
        (ctx: CanvasRenderingContext2D) => {
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            for (let i = 0; i < bitmap.length; i++) {
                for (let j = 0; j < bitmap[i].length; j++) {
                    ctx.fillStyle = bitmap[i][j] ? 'black' : 'white';
                    ctx.fillRect(j * pixelSize, i * pixelSize, pixelSize, pixelSize);
                    ctx.strokeRect(j * pixelSize, i * pixelSize, pixelSize, pixelSize);
                }
            }
        },
        [bitmap, pixelSize]
    );

    useEffect(() => {
        canvasRef.current?.triggerRender();
    }, [bitmap, pixelSize]);

    return (
        <Canvas
            onPointerDown={onPointerDown}
            draw={continuousDraw}
            autoDraw={false}
            className={cn('w-full h-full min-w-0 min-h-0', className)}
        />
    );
}

function ColoredBitmapCanvas({
    bitmap,
    onPointerDown,
    pixelSize,
    className,
}: {
    bitmap: Array<Array<RGBObject>>;
    onPointerDown: (event: PointerEvent) => void;
    pixelSize: number;
    className?: string;
}) {
    const canvasRef = useRef<CanvasHandle>(null);

    const continuousDraw = useCallback(
        (ctx: CanvasRenderingContext2D) => {
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            for (let i = 0; i < bitmap.length; i++) {
                for (let j = 0; j < bitmap[i].length; j++) {
                    ctx.fillStyle = new ColorTranslator(bitmap[i][j]).RGB;
                    ctx.fillRect(j * pixelSize, i * pixelSize, pixelSize, pixelSize);
                    ctx.strokeRect(j * pixelSize, i * pixelSize, pixelSize, pixelSize);
                }
            }
        },
        [bitmap, pixelSize]
    );

    useEffect(() => {
        canvasRef.current?.triggerRender();
    }, [bitmap, pixelSize]);

    return (
        <Canvas
            onPointerDown={onPointerDown}
            draw={continuousDraw}
            autoDraw={false}
            className={cn('w-full h-full min-w-0 min-h-0', className)}
        />
    );
}

export function DobbyPatternEditor() {
    const boxSize = 30;

    const nThreads = 10;
    const nTreadles = 4;
    const nFrames = 4;

    const nRows = 8;

    const [threadsColors] = useState(
        Array.from({ length: nThreads }, (_, i) => niceColors[0][i % niceColors[0].length])
    );

    const [rowsColors] = useState(
        Array.from({ length: nThreads }, (_, i) => niceColors[1][i % niceColors[0].length])
    );

    const [threadsColorsBitmap, setThreadsColorsBitmap] = useState(
        Array.from({ length: 1 }, () =>
            Array.from(
                { length: nThreads },
                (_, k) => new ColorTranslator(threadsColors[k % threadsColors.length]).RGBObject
            )
        )
    );

    const [rowsColorsBitmap, setRowsColorsBitmap] = useState(
        Array.from({ length: nRows }, (_, k) =>
            Array.from(
                { length: 1 },
                () => new ColorTranslator(rowsColors[k % rowsColors.length]).RGBObject
            )
        )
    );

    const [threading, setThreading] = useState(
        Array.from({ length: nFrames }, () => Array.from({ length: nThreads }, () => false))
    );
    const [tieup, setTieup] = useState(
        Array.from({ length: nFrames }, () => Array.from({ length: nTreadles }, () => false))
    );
    const [drawdown, setDrawdown] = useState<Array<Array<RGBObject>>>(
        Array.from({ length: nRows }, () =>
            Array.from({ length: nThreads }, () => {
                return { R: 255, G: 255, B: 255 };
            })
        )
    );
    const [treadling, setTreadling] = useState(
        Array.from({ length: nRows }, () => Array.from({ length: nTreadles }, () => false))
    );

    const updateDrawdown = useCallback(() => {
        const isThreadTaken = (i: number, j: number) => {
            const treadlings = treadling[i];
            const frames: number[] = [];
            for (let row = 0; row < nFrames; row++) {
                if (threading[row][j]) {
                    if (treadlings.some((col, colIdx) => col && tieup[row][colIdx])) {
                        frames.push(row);
                    }
                }
            }
            return frames.some((frame) => threading[frame][j]);
        };
        setDrawdown((prev) =>
            prev.map((row, i) =>
                row.map(
                    (col, j) =>
                        new ColorTranslator(isThreadTaken(i, j) ? threadsColors[j] : rowsColors[i])
                            .RGBObject
                )
            )
        );
    }, [rowsColors, threading, threadsColors, tieup, treadling]);

    useEffect(() => {
        updateDrawdown();
    }, [updateDrawdown, treadling, threading, tieup]);

    const onThreadingPointerDown = (event: PointerEvent) => {
        const i = Math.floor(event.offsetY / boxSize);
        const j = Math.floor(event.offsetX / boxSize);
        setThreading((b) => {
            const newBitmap = [...b];
            newBitmap[i] = [...b[i]];
            newBitmap[i][j] = !newBitmap[i][j];
            return newBitmap;
        });
    };

    const onTieupPointerDown = (event: PointerEvent) => {
        const i = Math.floor(event.offsetY / boxSize);
        const j = Math.floor(event.offsetX / boxSize);
        setTieup((b) => {
            const newBitmap = [...b];
            newBitmap[i] = [...b[i]];
            newBitmap[i][j] = !newBitmap[i][j];
            return newBitmap;
        });
    };

    const onDrawdownPointerDown = () => {};

    const onTreadlingPointerDown = (event: PointerEvent) => {
        const i = Math.floor(event.offsetY / boxSize);
        const j = Math.floor(event.offsetX / boxSize);
        setTreadling((b) => {
            const newBitmap = [...b];
            newBitmap[i] = [...b[i]];
            newBitmap[i][j] = !newBitmap[i][j];
            return newBitmap;
        });
    };

    return (
        <div>
            <div className="grid grid-cols-[auto_auto] grid-rows-[auto_auto_auto_auto] gap-2 p-4 w-fit h-fit">
                <div
                    style={{
                        width: nThreads * boxSize,
                        height: boxSize,
                    }}
                >
                    <ColoredBitmapCanvas
                        bitmap={threadsColorsBitmap}
                        pixelSize={boxSize}
                        onPointerDown={() => {}}
                    />
                </div>

                <div
                    style={{
                        width: nThreads * boxSize,
                        height: nFrames * boxSize,
                    }}
                    className="row-start-2"
                >
                    <BitmapCanvas
                        bitmap={threading}
                        pixelSize={boxSize}
                        onPointerDown={onThreadingPointerDown}
                    />
                </div>

                <div
                    style={{
                        width: nTreadles * boxSize,
                        height: nFrames * boxSize,
                    }}
                    className={cn('aspect-square, row-start-2')}
                >
                    <BitmapCanvas
                        bitmap={tieup}
                        pixelSize={boxSize}
                        onPointerDown={onTieupPointerDown}
                    />
                </div>

                <div
                    style={{
                        width: nThreads * boxSize,
                        height: nRows * boxSize,
                    }}
                    className={cn('col-start-1 row-start-3')}
                >
                    <ColoredBitmapCanvas
                        bitmap={drawdown}
                        pixelSize={boxSize}
                        onPointerDown={onDrawdownPointerDown}
                    />
                </div>

                <div
                    style={{
                        width: nTreadles * boxSize,
                        height: nRows * boxSize,
                    }}
                    className="row-start-3"
                >
                    <BitmapCanvas
                        bitmap={treadling}
                        pixelSize={boxSize}
                        onPointerDown={onTreadlingPointerDown}
                    />
                </div>

                <div
                    style={{
                        width: boxSize,
                        height: nRows * boxSize,
                    }}
                    className="row-start-3 col-start-3"
                >
                    <ColoredBitmapCanvas
                        bitmap={rowsColorsBitmap}
                        pixelSize={boxSize}
                        onPointerDown={() => {}}
                    />
                </div>
            </div>
        </div>
    );
}
