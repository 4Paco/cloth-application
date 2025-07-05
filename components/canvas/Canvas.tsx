import React, { useEffect, useImperativeHandle, forwardRef, Ref } from 'react';
import useCanvas, {
    CanvasDrawFunction,
    CanvasPostdrawFunction,
    CanvasPredrawFunction,
} from './CanvasHook';

function resizeCanvas(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    const { width, height } = canvas.getBoundingClientRect();
    if (canvas.width !== width || canvas.height !== height) {
        const { devicePixelRatio: ratio = 1 } = window;
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        context.scale(ratio, ratio);
        return true;
    }
    return false;
}

const _postdraw = (ctx: CanvasRenderingContext2D) => {
    ctx.restore();
};

const _predraw = (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    context.save();
    resizeCanvas(context, canvas);
    const { width, height } = context.canvas;
    context.clearRect(0, 0, width, height);
};

export type CanvasHandle = {
    triggerRender: () => void;
};

const Canvas = forwardRef(function Canvas(
    props: {
        draw: CanvasDrawFunction;
        predraw?: CanvasPredrawFunction;
        postdraw?: CanvasPostdrawFunction;
        onPointerDown?: (ev: PointerEvent) => void;
        className: string;
        autoDraw: boolean;
    },
    ref: Ref<CanvasHandle>
) {
    const {
        draw,
        autoDraw,
        predraw = _predraw,
        postdraw = _postdraw,
        onPointerDown,
        ...rest
    } = props;

    const { canvasRef, triggerRender } = useCanvas(draw, {
        context: '2d',
        autoDraw,
        predraw,
        postdraw,
    });

    useEffect(() => {
        if (canvasRef.current && onPointerDown) {
            const current = canvasRef.current;
            current.addEventListener('pointerdown', onPointerDown);
            return () => {
                current.removeEventListener('pointerdown', onPointerDown);
            };
        }
    }, [canvasRef, onPointerDown]);

    useImperativeHandle(ref, () => ({
        triggerRender,
    }));

    return <canvas ref={canvasRef} {...rest} />;
});

export default Canvas;
