'use client';

import dynamic from 'next/dynamic';
import { ColorEntry } from '@/components/color_handling';
import { useState } from 'react';
import { useDesign } from '@/components/DesignContextProvider';
import { useRouter } from 'next/navigation';

const CIESphere = dynamic(() => import('@/components/CIESphere'), {
    ssr: false,
});

function LogInButton() {
    return (
        <button
            className="mr-4 h-fit self-end bg-amber-500 p-2 rounded-2xl"
            onClick={() => {
                window.location.href = '/login';
            }}
        >
            Log In
        </button>
    );
}

function MainButton() {
    return (
        <button
            className="mr-4 h-fit self-end bg-amber-500 p-2 rounded-2xl"
            onClick={() => {
                window.location.href = '/';
            }}
        >
            Main Page
        </button>
    );
}

export default function Home() {
    const { requiredColorCount, setSelectedColors } = useDesign();
    const [currentSelectedColors, setCurrentSelectedColors] = useState<ColorEntry[]>([]);
    const router = useRouter();

    // Handler for when the user confirms their color selection
    function handleContinue() {
        // Store the selected colors in the context (as hex or your preferred format)
        setSelectedColors(currentSelectedColors.map(c => c.id.toString()));
        router.push('/preview'); // Or wherever you want to go next
    }

    // Only allow selection up to requiredColorCount
    function handleColorChange(newColors: ColorEntry[]) {
        if (newColors.length <= requiredColorCount) {
            setCurrentSelectedColors(newColors);
        }
    }

    return (
        <main style={{ width: '100vw', height: '100vh', background: 'black' }}>
            <LogInButton />
            <MainButton />
            <div className="text-white text-center mb-4">
                <h2 className="text-2xl font-bold mb-2">Pick {requiredColorCount} color{requiredColorCount > 1 ? 's' : ''} for your pattern</h2>
                <p className="mb-2">
                    {currentSelectedColors.length}/{requiredColorCount} selected
                </p>
            </div>
            <CIESphere
                current_selectedColors={currentSelectedColors}
                setCurrentSelectedColors={handleColorChange}
                maxColors={requiredColorCount}
            />
            <div
                style={{
                    visibility: currentSelectedColors.length === requiredColorCount ? 'visible' : 'hidden',
                    marginTop: 24,
                    textAlign: 'center'
                }}
            >
                <button
                    className="bg-blue-600 px-4 py-2 rounded text-white"
                    onClick={handleContinue}
                >
                    Continue
                </button>
            </div>
        </main>
    );
}