'use client';

import dynamic from 'next/dynamic';
import { ColorEntry } from './color_handling';
import { useState } from 'react';


const CIESphere = dynamic(() => import('@/components/CIESphere'), {
    ssr: false,
});

function LogInButton() {
    return (
        <>
            <button
                className="mr-4 h-fit self-end  bg-amber-500 p-2 rounded-2xl"
                onClick={() => {
                    window.location.href = '/login';
                }}
            >
                Log In
            </button>
        </>
    );
}

function MainButton() {
    return (
        <>
            <button
                className="mr-4 h-fit self-end  bg-amber-500 p-2 rounded-2xl"
                onClick={() => {
                    window.location.href = '/';
                }}
            >
                Main Page
            </button>
        </>
    );
}
function TextureButton() {
    return (
        <>
            <button
                className="mr-4 h-fit self-end  bg-amber-500 p-2 rounded-2xl"
                onClick={() => {
                    window.location.href = '/texture';
                }}
            >
                Configure the texture!
            </button>
        </>
    );
}

export default function Home() {
    const [currentSelectedColors, setCurrentSelectedColors] = useState<ColorEntry[]>([]);
    return (
        <main style={{ width: '100vw', height: '100vh', background: 'black' }}>
            <LogInButton />
            <MainButton />
            <div
            style={{
                visibility: currentSelectedColors.length >= 1 ? 'visible' : 'hidden',
            }}
            >
            <TextureButton />
            </div>
            <CIESphere current_selectedColors={currentSelectedColors} setCurrentSelectedColors={setCurrentSelectedColors} />
            
        </main>
    );
}
