import { useEffect, useRef } from 'react';

function Visualizer({ isPlaying, accent }) {
  const containerRef = useRef(null);
  const barsRef = useRef([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';
    barsRef.current = [];
    for (let i = 0; i < 52; i++) {
      const bar = document.createElement('div');
      bar.className = 'viz-bar';
      bar.style.height = '3px';
      container.appendChild(bar);
      barsRef.current.push(bar);
    }
  }, []);

  useEffect(() => {
    barsRef.current.forEach(b => b.style.background = accent);
  }, [accent]);

  useEffect(() => {
    clearInterval(intervalRef.current);
    if (!isPlaying) {
      barsRef.current.forEach(b => b.style.height = '3px');
      return;
    }
    intervalRef.current = setInterval(() => {
      barsRef.current.forEach(b => {
        const cur = parseFloat(b.style.height) || 3;
        const target = Math.random() * 36 + 4;
        b.style.height = Math.round(cur * 0.65 + target * 0.35) + 'px';
      });
    }, 80);
    return () => clearInterval(intervalRef.current);
  }, [isPlaying]);

  return <div className="viz-bar-wrap" ref={containerRef} />;
}

export default Visualizer;
