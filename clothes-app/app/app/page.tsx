'use client';

import { useRouter } from 'next/navigation';

export default function App() {
    const router = useRouter();

    router.push('/app/configuration');
    return <></>;
}
