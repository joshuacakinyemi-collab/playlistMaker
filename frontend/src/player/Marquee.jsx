import { useEffect, useRef, useState } from 'react';

// Scrolls its text sideways only when it doesn't fit its box, like a
// hardware mp3 player's title marquee. Loops continuously in one direction
// (not back-and-forth) by animating a doubled copy of the text by exactly
// -50%, so the second copy seamlessly picks up where the first left off.
const MARQUEE_SPEED_PX_PER_SEC = 45;

function Marquee({ text, className = '' }) {
  const wrapRef = useRef(null);
  const measureRef = useRef(null);
  const [scrolling, setScrolling] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const measure = () => {
      const wrap = wrapRef.current;
      const el = measureRef.current;
      if (!wrap || !el) return;
      const singleWidth = el.scrollWidth;
      const overflow = singleWidth - wrap.clientWidth;
      if (overflow > 4) {
        setScrolling(true);
        setDuration(singleWidth / MARQUEE_SPEED_PX_PER_SEC);
      } else {
        setScrolling(false);
        setDuration(0);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [text]);

  return (
    <div className={`marquee ${className}`} ref={wrapRef}>
      <span className="marquee-measure" ref={measureRef} aria-hidden="true">{text}</span>
      {scrolling ? (
        <div className="marquee-track scrolling" style={{ '--marquee-duration': `${duration}s` }}>
          <span className="marquee-copy">{text}</span>
          <span className="marquee-copy">{text}</span>
        </div>
      ) : (
        <div className="marquee-track">{text}</div>
      )}
    </div>
  );
}

export default Marquee;
