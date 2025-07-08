'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, extend, useThree } from '@react-three/fiber';
import { ShaderMaterial } from 'three';
import { Slider } from '../ui/slider';
import * as THREE from 'three';
import { OrthographicCamera } from '@react-three/drei';
import Color from 'colorjs.io';
import { Button } from '../ui/button';

class OKLCHShaderMaterial extends ShaderMaterial {
    constructor() {
        super({
            uniforms: {
                uResolution: { value: new THREE.Vector2(1.0, 1.0) },
                uLightness: { value: 0.25 },
                uChroma: { value: 0.12 },
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                precision highp float;

                varying vec2 vUv;
                uniform vec2 uResolution;
                uniform float uLightness;
                uniform float uChroma;

                vec3 oklab_to_linear_srgb(float L, float a, float b) {
                    float l_ = L + 0.3963377774 * a + 0.2158037573 * b;
                    float m_ = L - 0.1055613458 * a - 0.0638541728 * b;
                    float s_ = L - 0.0894841775 * a - 1.2914855480 * b;

                    float l = l_*l_*l_;
                    float m = m_*m_*m_;
                    float s = s_*s_*s_;

                    return vec3(
                        +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
                        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
                        -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
                }

                vec3 get_rgb(vec2 uv) {
                    float lightness = pow(uLightness, 1./1.0);
                    float chroma = uv.y*0.5;
                    float hue = uv.x;

                    float L = lightness;
                    float a = chroma*cos(hue);
                    float b = chroma*sin(hue);

                    return oklab_to_linear_srgb(L, a, b);
                }
                
                bool is_outside(vec3 color) {
                    return color.r<0. || color.g<0. || color.b<0. || color.r>1. || color.g>1. || color.b>1.;
                }

                void main() {
                    vec2 uv_mapped = 2.*vUv - 1.;
                    vec2 uv = vec2(atan(uv_mapped.y, uv_mapped.x), length(uv_mapped));

                    vec3 rgb = get_rgb(uv);
                    
                    bool outside = is_outside(rgb);

                    if (outside) {
                        float thickness = 0.005;
                        bool limit = !is_outside(get_rgb(vec2(uv.x, uv.y-thickness))) || !is_outside(get_rgb(vec2(uv.x-thickness, uv.y))) || !is_outside(get_rgb(vec2(uv.x+thickness, uv.y)));
                        limit = false;
                        gl_FragColor = vec4(0., 0., 0., limit ? 1.0 : 0.0);
                    } else {
                        gl_FragColor = vec4(pow(rgb, vec3(1./3.)), 1.0);
                    }
                    
                }
            `,
            transparent: true,
        });
    }
}

extend({ OKLCHShaderMaterial });

function ColorWheelPlane({ lightness, chroma }: { lightness: number; chroma: number }) {
    const material = useMemo(() => new OKLCHShaderMaterial(), []);
    // const material = new THREE.MeshBasicMaterial({ color: 'red' });

    const { size: viewSize } = useThree();

    useFrame(() => {
        material.uniforms.uLightness.value = lightness;
        material.uniforms.uChroma.value = chroma;
        material.uniforms.uResolution.value.set(viewSize.width, viewSize.height);
    });

    return (
        <mesh>
            <planeGeometry args={[1, 1]} />
            <primitive attach="material" object={material} />
        </mesh>
    );
}

function ColorHandle({
    parentRef,
    initialLightness,
    setParentLightness,
    canvasSize,
}: {
    parentRef: React.RefObject<HTMLDivElement | null>;
    initialLightness: number;
    setParentLightness: React.Dispatch<React.SetStateAction<number>>;
    canvasSize: number;
}) {
    'use client';
    const [position, setPosition] = useState<THREE.Vector2>(
        new THREE.Vector2(canvasSize / 2, canvasSize / 2)
    );
    const [lightness, setLightness] = useState<number>(initialLightness);
    const [dragging, setDragging] = useState<boolean>(false);

    const halfSize = useMemo(() => {
        return new THREE.Vector2(canvasSize / 2, canvasSize / 2);
    }, [canvasSize]);

    const [color, inSpace] = useMemo(() => {
        const positionNormalized = position.clone().sub(halfSize).divide(halfSize);
        const theta = (-Math.atan2(positionNormalized.y, positionNormalized.x) * 180) / Math.PI + 0;
        const r = positionNormalized.length();
        const color = new Color('oklch', [lightness, r * 0.5, theta]);
        const inSpace = color.inGamut('srgb');
        return [color, inSpace];
    }, [halfSize, lightness, position]);

    const handlePointerMove = (e: PointerEvent) => {
        if (!dragging) return;
        if (!parentRef || !parentRef.current) return;
        const rect = parentRef.current.getBoundingClientRect();
        const v = new THREE.Vector2(Math.round(e.clientX - rect.x), Math.round(e.clientY - rect.y));
        v.sub(halfSize);
        v.clampLength(0, canvasSize / 2);
        v.add(halfSize);
        setPosition(v);
    };

    const handlePointerUp = () => {
        setDragging(false);
    };

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        const newL = Math.max(0, Math.min(1, lightness + e.deltaY * 0.0001));
        setLightness(newL);
        setParentLightness(newL);
    };

    useEffect(() => {
        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', handlePointerUp);
        return () => {
            document.removeEventListener('pointermove', handlePointerMove);
            document.removeEventListener('pointerup', handlePointerUp);
        };
    });

    console.log(lightness);

    return (
        <div
            className="size-8 hover:size-[calc(var(--spacing)*8+2px)] hover:border-0 group transition-[width,height,border] border-white border-2 absolute -translate-x-1/2 -translate-y-1/2 rounded-full cursor-pointer"
            style={{
                left: position.x + 'px',
                top: position.y + 'px',
                backgroundColor: inSpace ? color.toString() : 'black',
            }}
            onPointerDown={() => setDragging(true)}
            onPointerOver={() => setParentLightness(lightness)}
            onWheel={handleWheel}
        >
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-4 rounded-full text-white flex items-center justify-center select-none">
                1
            </div>
            <div className="hidden group-hover:block absolute size-12 transition-[width,height] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[60deg] pointer-events-none">
                <svg
                    className="-rotate-90 scale-full"
                    viewBox="-18 -18 36 36"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <circle
                        cx="0"
                        cy="0"
                        r="16"
                        fill="none"
                        className="stroke-current text-gray-200"
                        stroke-width="4"
                        stroke-dasharray="100"
                        stroke-dashoffset={66}
                        stroke-linecap="round"
                    ></circle>
                    <circle
                        cx="0"
                        cy="0"
                        r="16"
                        fill="none"
                        className="stroke-current text-blue-600"
                        stroke-width="4"
                        stroke-dasharray="100"
                        stroke-dashoffset={100 - 33 * lightness}
                        stroke-linecap="round"
                    ></circle>
                </svg>
            </div>
        </div>
    );
}

export default function OKLABColorWheel({ size = 400, l = 0.25 }) {
    const [lightness, setLightness] = useState(l);
    const [chroma, setChroma] = useState(0.12);
    const [handles, setHandles] = useState<React.JSX.Element[]>([]);

    const colorHandlesParentRef = useRef(null);

    return (
        <div className="flex p-4 gap-4">
            <div className="flex flex-col w-[500px]">
                <div className="flex gap-2">
                    <div>Chroma</div>
                    <Slider
                        value={[chroma]}
                        onValueChange={(v) => setChroma(v[0])}
                        min={0}
                        max={1}
                        step={0.001}
                    />
                    <div>{chroma.toFixed(3)}</div>
                </div>
                <div className="flex gap-2">
                    <div>Lightness</div>
                    <Slider
                        value={[lightness]}
                        onValueChange={(v) => setLightness(v[0])}
                        min={0}
                        max={1}
                        step={0.001}
                    />
                    <div>{lightness.toFixed(3)}</div>
                </div>
                <Button
                    onClick={() => {
                        setHandles((handles) => [
                            <ColorHandle
                                key={handles.length}
                                initialLightness={lightness}
                                setParentLightness={setLightness}
                                parentRef={colorHandlesParentRef}
                                canvasSize={size}
                            />,
                            ...handles,
                        ]);
                    }}
                >
                    Add handle
                </Button>
            </div>
            <div
                style={{ width: size, height: size }}
                className="relative"
                ref={colorHandlesParentRef}
            >
                <Canvas orthographic dpr={[1, 2]}>
                    <OrthographicCamera makeDefault position={[0, 0, 1]} zoom={size} />
                    <ColorWheelPlane lightness={lightness} chroma={chroma} />
                </Canvas>
                {handles.map((h) => h)}
            </div>
        </div>
    );
}
