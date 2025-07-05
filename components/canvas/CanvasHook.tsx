import { useRef, useEffect, useCallback } from 'react';

export type CanvasDrawFunction = (context: CanvasRenderingContext2D, frameCount: number) => void;
export type CanvasPredrawFunction = (
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement
) => void;
export type CanvasPostdrawFunction = (ctx: CanvasRenderingContext2D) => void;
export type CanvasOptions = {
    context: string;
    autoDraw: boolean;
    predraw: CanvasPredrawFunction;
    postdraw: CanvasPostdrawFunction;
};

const useCanvas = (draw: CanvasDrawFunction, options: CanvasOptions) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameCountRef = useRef(0);
    const requestRef = useRef<number | null>(null);
    const drawFrame = useRef<() => void>(() => {}); // placeholder

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        const render = () => {
            frameCountRef.current++;
            options.predraw(context, canvas);
            draw(context, frameCountRef.current);
            options.postdraw(context);

            if (options.autoDraw) {
                requestRef.current = window.requestAnimationFrame(render);
            }
        };

        drawFrame.current = render;

        render();

        return () => {
            if (requestRef.current) {
                window.cancelAnimationFrame(requestRef.current);
            }
        };
    }, [draw, options]);

    const triggerRender = useCallback(() => {
        drawFrame.current();
    }, []);

    return { canvasRef, triggerRender };
};

export default useCanvas;
