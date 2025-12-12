import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const MermaidViewer = dynamic(() => import('../components/MermaidViewer'), { ssr: false });

export default function Home() {
  const [diagram, setDiagram] = useState('graph TD; A-->B;');

  useEffect(() => {
    // fetch a sample diagram later
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>RepoArchitectAgent Demo</h1>
      <MermaidViewer diagram={diagram} />
    </main>
  );
}
