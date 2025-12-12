import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({ startOnLoad: false });

export default function MermaidViewer({ diagram }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!diagram || !ref.current) return;
    mermaid.render('graph1', diagram).then(({ svg }) => {
      ref.current.innerHTML = svg;
    }).catch((e) => {
      ref.current.innerText = String(e);
    });
  }, [diagram]);
  return <div ref={ref} />;
}
