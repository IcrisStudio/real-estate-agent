'use client';

import dynamic from 'next/dynamic';

const JarvisAgent = dynamic(() => import('@/components/JarvisAgent'), {
  ssr: false,
});

export default function Home() {
  return <JarvisAgent />;
}
