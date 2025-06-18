'use client';

import dynamic from 'next/dynamic';

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

export default function Home() {
    return (
        <main style={{ width: '100vw', height: '100vh', background: 'black' }}>
            <LogInButton />
            <MainButton />
            <CIESphere />
        </main>
    );
}
