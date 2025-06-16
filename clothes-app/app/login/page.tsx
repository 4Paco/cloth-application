'use client';
import { LoginForm } from '@/components/login-form';

function CIEButton() {
    return (
        <>
            <button
                className="mr-4 h-fit self-end bg-amber-500 p-2 rounded-2xl"
                onClick={() => {
                    window.location.href = '/CIE';
                }}
            >
                Go to CIE
            </button>
        </>
    );
}

function MainButton() {
    return (
        <>
            <button
                className="mr-4 h-fit self-end bg-amber-500 p-2 rounded-2xl"
                onClick={() => {
                    window.location.href = '/';
                }}
            >
                Go to Main page
            </button>
        </>
    );
}

export default function LoginPage() {
    return (
        <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
            <CIEButton />
            <MainButton />
            <div className="w-full max-w-sm md:max-w-3xl">
                <LoginForm />
            </div>
        </div>
    );
}
