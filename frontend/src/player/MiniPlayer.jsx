import { usePlayer } from './PlayerContext.jsx';

// The strip along the bottom of every screen except Now Playing: what's
// playing, play/pause and skip, and a tap target that opens Now Playing.
function MiniPlayer({ onOpen }) {
  const player = usePlayer();
  const { currentSong, art, isPlaying, currentTime, duration, error } = player;
  if (!currentSong) return null;

  const progress = duration ? Math.min(currentTime / duration, 1) : 0;

  return (
    <div className="mini-player">
      <div className="mini-progress" style={{ width: `${progress * 100}%` }} />
      <button type="button" className="mini-info" onClick={onOpen} title="Open Now Playing">
        <span className="mini-art">
          {art ? <img src={art} alt="" /> : <span aria-hidden="true">♫</span>}
        </span>
        <span className="mini-text">
          <span className="mini-title">{currentSong.title}</span>
          <span className={`mini-artist${error ? ' error' : ''}`}>{error ? "Can't play this video" : currentSong.author}</span>
        </span>
      </button>
      <div className="mini-controls">
        <button type="button" className="tbtn" onClick={player.prev} title="Previous">|◄</button>
        <button type="button" className="play-btn small" onClick={player.togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? '||' : '►'}
        </button>
        <button type="button" className="tbtn" onClick={player.next} title="Next">►|</button>
      </div>
    </div>
  );
}

export default MiniPlayer;
