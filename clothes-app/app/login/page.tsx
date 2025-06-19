'use client';
import { LoginForm } from '@/components/login-form';
import { Button } from '@/components/ui/button';

function MainButton() {
    return (
        <>
            <Button
                className="mr-4 self-start p-2 rounded-2xl w-20 h-20"
                onClick={() => {
                    window.location.href = '/';
                }}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    className="w-[40px] h-[40px]" // Explicitly set width and height
                    viewBox="0 0 16 16" // Adjust viewBox if necessary
                >
                    <path d="M6.5 14.5v-3.505c0-.245.25-.495.5-.495h2c.25 0 .5.25.5.5v3.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5" />
                </svg>
            </Button>
        </>
    );
}

export default function LoginPage() {
    return (
        <div className="bg-black flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
            <MainButton />
            <div className="w-full max-w-sm md:max-w-3xl">
                <LoginForm />
            </div>
        </div>
    );
}
