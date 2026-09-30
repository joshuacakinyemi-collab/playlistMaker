// A little pocket mp3 player (screen + click wheel), for MP3 Player Mode.
function PocketPlayerIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="5" y="2" width="14" height="20" rx="3" />
      <rect x="8" y="5" width="8" height="6" rx="1" />
      <circle cx="12" cy="16" r="3" />
    </svg>
  );
}

export default PocketPlayerIcon;
