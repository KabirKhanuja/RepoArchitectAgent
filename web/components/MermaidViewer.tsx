"use client";

import { useEffect, useRef } from "react";
import mermaid from "mermaid";

mermaid.initialize({ startOnLoad: false });

export interface MermaidViewerProps {
  diagram: string;
}

export default function MermaidViewer({ diagram }: MermaidViewerProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!diagram || !ref.current) return;

    mermaid
      .render("graph1", diagram)
      .then(({ svg }) => {
        if (ref.current) {
          ref.current.innerHTML = svg;
        }
      })
      .catch((e) => {
        if (ref.current) {
          ref.current.innerText = String(e);
        }
      });
  }, [diagram]);

  return <div ref={ref} />;
}
