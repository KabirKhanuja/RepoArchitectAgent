import dynamic from "next/dynamic";
import type { NextPage } from "next";
import { useEffect, useState } from "react";

const MermaidViewer = dynamic(() => import("@/components/MermaidViewer"), { ssr: false });

const defaultDiagram =
  process.env.NEXT_PUBLIC_DEFAULT_MERMAID ?? "graph TD; A-->B;";

const onLoadDiagram =
  process.env.NEXT_PUBLIC_ONLOAD_MERMAID ?? "graph TD; Repo-->Api; Repo-->Web;";

const Home: NextPage = () => {
  const [diagram, setDiagram] = useState<string>(defaultDiagram);

  useEffect(() => {
    // TODO: wire to /api/analyze
    setDiagram(onLoadDiagram);
  }, []);

  return (
    <main className="min-h-screen p-6 space-y-4">
      <h1 className="text-3xl font-semibold">RepoArchitectAgent Demo</h1>
      <p className="text-slate-300">Mermaid diagram preview:</p>
      <div className="rounded-md border border-slate-700 bg-slate-900 p-4">
        <MermaidViewer diagram={diagram} />
      </div>
    </main>
  );
};

export default Home;
