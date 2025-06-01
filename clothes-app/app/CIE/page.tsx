'use client';

import dynamic from 'next/dynamic';

const CIESphere = dynamic(() => import('@/components/CIESphere'), {
  ssr: false,
});

export default function Home() {
  return (
    <main style={{ width: '100vw', height: '100vh' }}>
      <CIESphere />
    </main>
  );
}
