import Marquee from './Marquee.jsx';
import Visualizer from './Visualizer.jsx';
import { formatTime, usePlayer } from './PlayerContext.jsx';
import { useTheme } from '../ThemeContext.jsx';

// The full-screen "Now Playing" view: album art, scrolling title, a
// visualizer and the transport — what a pocket mp3 player shows while a
// song plays.
function NowPlaying({ onOpenQueue }) {
  const player = usePlayer();
  const { accent } = useTheme();
  const { currentSong, nextSong, art, error, loop, shuffle, isPlaying, currentTime, duration } = player;

  if (!currentSong) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon" aria-hidden="true">♫</div>
        <p>Nothing playing yet.</p>
        <p className="muted">Open a playlist to start listening.</p>
      </div>
    );
  }

  const progress = duration ? Math.min(currentTime / duration, 1) : 0;

  let status;
  if (error) status = <span className="error">{error}</span>;
  else if (loop) status = '↺ Looping this song';
  else if (nextSong) status = <>Next: {nextSong.title} · {nextSong.author}</>;

  return (
    <div className="now-playing">
      <div className="np-art">
        {art ? <img src={art} alt="" /> : <span aria-hidden="true">♫</span>}
      </div>

      <div className="np-meta">
        <Marquee text={currentSong.title} className="np-title" />
        <Marquee text={currentSong.author} className="np-artist" />
        {player.playlist && (
          <button type="button" className="np-playlist" onClick={onOpenQueue}>
            {player.playlist.title} · {player.currentIndex + 1} of {player.queue.length}
          </button>
        )}
        <div className="np-status">{status}</div>
      </div>

      <Visualizer isPlaying={isPlaying} accent={accent.color} />

      <div className="np-progress">
        <span className="np-time">{formatTime(currentTime)}</span>
        <div
          className="np-track"
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(currentTime)}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            player.seekTo((e.clientX - rect.left) / rect.width);
          }}
        >
          <div className="np-fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <span className="np-time">{formatTime(duration)}</span>
      </div>

      <div className="transport">
        <button type="button" className={`tbtn${shuffle ? ' on' : ''}`} onClick={player.toggleShuffle} title="Shuffle" aria-pressed={shuffle}>⇄</button>
        <button type="button" className="tbtn" onClick={player.prev} title="Previous">|◄</button>
        <button type="button" className="play-btn" onClick={player.togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? '||' : '►'}
        </button>
        <button type="button" className="tbtn" onClick={player.next} title="Next">►|</button>
        <button type="button" className={`tbtn${loop ? ' on' : ''}`} onClick={player.toggleLoop} title="Loop song" aria-pressed={loop}>↺</button>
      </div>
    </div>
  );
}

export default NowPlaying;
