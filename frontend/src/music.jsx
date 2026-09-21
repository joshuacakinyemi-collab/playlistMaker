import { useState, useEffect, useRef } from 'react';
import Visualizer from './components/theme/Visualizer';
import { useTheme } from './ThemeContext';
import { resolveSongYoutube } from './adapters/song-adapters.js';

const PANEL_TABS = [
  { key: 'tracks', label: 'Tracks' },
  { key: 'playlists', label: 'Playlists' },
];

function loadYoutubeAPI() {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) return resolve();
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);
    window.onYouTubeIframeAPIReady = resolve;
  });
}

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

function MusicPlayer({ songs, playlists = [], currentPlaylistId, onSwitchPlaylist }) {
  const { accent } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [loop, setLoop] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [panelTab, setPanelTab] = useState('tracks');
  const [youtubeData, setYoutubeData] = useState({});
  const [duration, setDuration] = useState('0:00');
  const [currentTime, setCurrentTime] = useState('0:00');

  // Refs so onStateChange (set up once) always reads current values
  const currentIndexRef = useRef(0);
  const shuffleRef = useRef(false);
  const loopRef = useRef(false);
  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const containerRef = useRef(null);
  // Guards against constructing two YT.Player instances on the same
  // container when initPlayer is invoked twice before the first finishes
  // its async setup (e.g. React StrictMode's dev-only double-invoke, or a
  // fast unmount/remount when switching playlists).
  const creatingPlayerRef = useRef(false);

  // Shuffle "bag": a shuffled order of every song index, walked one at a
  // time so every song is played once before any song repeats.
  const shuffleOrderRef = useRef([]);
  const shufflePosRef = useRef(0);

  const buildShuffleOrder = (startIndex) => {
    const rest = songs
      .map((_, i) => i)
      .filter((i) => i !== startIndex);
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    return startIndex === undefined ? rest : [startIndex, ...rest];
  };

  const goToIndex = (i) => {
    currentIndexRef.current = i;
    setCurrentIndex(i);
  };

  const toggleShuffle = () => {
    const next = !shuffleRef.current;
    shuffleRef.current = next;
    setShuffle(next);
    if (next) {
      shuffleOrderRef.current = buildShuffleOrder(currentIndexRef.current);
      shufflePosRef.current = 0;
    }
  };

  const toggleLoop = () => {
    const next = !loopRef.current;
    loopRef.current = next;
    setLoop(next);
  };

  const currentSong = songs[currentIndex];
  let nextIndex;
  if (shuffle && shuffleOrderRef.current.length === songs.length) {
    const peekPos = shufflePosRef.current + 1;
    nextIndex = peekPos < shuffleOrderRef.current.length
      ? shuffleOrderRef.current[peekPos]
      : shuffleOrderRef.current[0];
  } else {
    nextIndex = (currentIndex + 1) % songs.length;
  }
  const nextSong = songs[nextIndex];

  const fetchYoutubeData = async (song) => {
    if (youtubeData[song.song_id]) return youtubeData[song.song_id];
    const { data, error } = await resolveSongYoutube(song.song_id);
    if (error) return null;
    setYoutubeData((prev) => ({ ...prev, [song.song_id]: data }));
    return data;
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startTimeTracking = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (playerRef.current?.getCurrentTime) {
        setCurrentTime(formatTime(playerRef.current.getCurrentTime()));
        setDuration(formatTime(playerRef.current.getDuration()));
      }
    }, 500);
  };

  // changeSong reads from refs so it's safe to call from onStateChange
  const changeSong = (next = true) => {
    const idx = currentIndexRef.current;
    let newIndex;
    if (shuffleRef.current) {
      if (shuffleOrderRef.current.length !== songs.length) {
        shuffleOrderRef.current = buildShuffleOrder(idx);
        shufflePosRef.current = 0;
      }
      if (next) {
        shufflePosRef.current += 1;
        if (shufflePosRef.current >= shuffleOrderRef.current.length) {
          // Played through every song — reshuffle and start the bag over.
          shuffleOrderRef.current = buildShuffleOrder();
          shufflePosRef.current = 0;
        }
      } else {
        shufflePosRef.current -= 1;
        if (shufflePosRef.current < 0) {
          shufflePosRef.current = shuffleOrderRef.current.length - 1;
        }
      }
      newIndex = shuffleOrderRef.current[shufflePosRef.current];
    } else if (next) newIndex = (idx + 1) % songs.length;
    else newIndex = (idx - 1 + songs.length) % songs.length;
    goToIndex(newIndex);
    initPlayer(songs[newIndex], true);
  };

  // isStale lets a call abandon itself once its owning effect has been
  // cleaned up (React StrictMode's dev-only double-invoke, or a fast
  // unmount while a fetch/await is still in flight) instead of touching
  // refs — or restarting the time-tracking interval — for a component
  // that's already gone.
  const initPlayer = async (song, autoStart = false, isStale = () => false) => {
    const data = await fetchYoutubeData(song);
    if (!data || isStale()) return;

    await loadYoutubeAPI();
    if (isStale()) return;

    if (playerRef.current?.loadVideoById) {
      playerRef.current.loadVideoById(data.youtube_id);
      if (autoStart) playerRef.current.playVideo?.();
      else playerRef.current.pauseVideo?.();
    } else if (!creatingPlayerRef.current && containerRef.current) {
      creatingPlayerRef.current = true;
      playerRef.current = new window.YT.Player(containerRef.current, {
        height: '0',
        width: '0',
        videoId: data.youtube_id,
        playerVars: { autoplay: 0 },
        events: {
          onReady: (e) => {
            creatingPlayerRef.current = false;
            if (isStale()) return;
            if (autoStart) e.target.playVideo();
            else e.target.pauseVideo();
            startTimeTracking();
          },
          onStateChange: (e) => {
            setIsPlaying(e.data === window.YT.PlayerState.PLAYING);
            if (e.data === window.YT.PlayerState.ENDED) {
              if (loopRef.current) {
                // Replay the same song
                e.target.seekTo(0);
                e.target.playVideo();
              } else {
                // Always advance to next song
                changeSong(true);
              }
            }
          },
        },
      });
    }
    if (!isStale()) startTimeTracking();
  };

  useEffect(() => {
    let cancelled = false;
    if (songs.length > 0) initPlayer(songs[0], false, () => cancelled);
    return () => {
      cancelled = true;
      clearInterval(intervalRef.current);
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, []);

  const togglePlay = () => {
    if (!playerRef.current?.pauseVideo) return;
    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  };

  const playSong = (index) => {
    goToIndex(index);
    if (shuffleRef.current) {
      const pos = shuffleOrderRef.current.indexOf(index);
      if (pos !== -1) {
        shufflePosRef.current = pos;
      } else {
        shuffleOrderRef.current = buildShuffleOrder(index);
        shufflePosRef.current = 0;
      }
    }
    initPlayer(songs[index], true);
  };

  const currentData = youtubeData[currentSong?.song_id];

  if (!songs.length) return null;

  return (
    <div className="win">
      <div ref={containerRef} style={{ display: 'none' }} />

      <div className="now-playing">
        <div className="art">
          {currentData?.thumbnail
            ? <img src={currentData.thumbnail} alt={currentSong.title} />
            : '♫'
          }
        </div>
        <div className="song-meta">
          <Marquee text={currentSong.title} className="song-title" />
          <Marquee text={currentSong.author} className="song-by" />
          <div className="song-sub">
            {loop
              ? '↺ Looping this song'
              : nextSong && <>Next: {nextSong.title} by {nextSong.author}</>
            }
          </div>
        </div>
        <button
          className={`tbtn playlist-toggle${showPlaylist ? ' on' : ''}`}
          onClick={() => setShowPlaylist((s) => !s)}
          title="Playlist"
          aria-label="Toggle playlist"
        >☰</button>
      </div>

      <Visualizer isPlaying={isPlaying} accent={accent.color} />

      {showPlaylist && (
        <div className="wmp-playlist-backdrop" onClick={() => setShowPlaylist(false)} />
      )}

      <div className={`wmp-playlist-panel${showPlaylist ? ' open' : ''}`}>
        <div className="wmp-playlist-panel-header">
          <div className="wmp-panel-tabs">
            {PANEL_TABS.map(({ key, label }) => (
              <button
                key={key}
                className={`wmp-panel-tab${panelTab === key ? ' active' : ''}`}
                onClick={() => setPanelTab(key)}
              >{label}</button>
            ))}
          </div>
          <button
            className="playlist-panel-close"
            onClick={() => setShowPlaylist(false)}
            aria-label="Close playlist"
          >✕</button>
        </div>

        {panelTab === 'tracks' ? (
          <>
            <div className="pl-header">
              <div>#</div>
              <div>Title</div>
              <div>Artist</div>
              <div>Time</div>
              <div></div>
            </div>

            <div className="wmp-playlist">
              {songs.map((song, i) => (
                <div
                  key={song.song_id}
                  className={`pl-item${i === currentIndex ? ' active' : ''}`}
                  onClick={() => {
                    playSong(i);
                    setShowPlaylist(false);
                  }}
                >
                  <div className="pl-num">
                    {i === currentIndex && isPlaying ? '▶' : i + 1}
                  </div>
                  <div className="pl-title">{song.title}</div>
                  <div className="pl-artist">{song.author}</div>
                  <div className="pl-dur">{i === currentIndex ? duration : ''}</div>
                  <div></div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="wmp-playlist-switcher">
            {playlists.length === 0 && (
              <div className="wmp-playlist-empty">No other playlists yet.</div>
            )}
            {playlists.map((pl) => {
              const isCurrent = pl.playlist_id === currentPlaylistId;
              return (
                <button
                  key={pl.playlist_id}
                  className={`wmp-playlist-switch-item${isCurrent ? ' current' : ''}`}
                  disabled={isCurrent}
                  onClick={() => {
                    if (!isCurrent) onSwitchPlaylist?.(pl);
                    setShowPlaylist(false);
                  }}
                >
                  <div className="wmp-playlist-switch-title">
                    {isCurrent && '▶ '}{pl.title}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="controls">
        <div className="prog-row">
          <span className="prog-time">{currentTime}</span>
          <div
            className="prog-track"
            onClick={(e) => {
              if (!playerRef.current?.getDuration) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              playerRef.current.seekTo(pct * playerRef.current.getDuration(), true);
            }}
          >
            <div
              className="prog-fill"
              style={{
                width: playerRef.current?.getDuration
                  ? `${(playerRef.current.getCurrentTime() / playerRef.current.getDuration()) * 100}%`
                  : '0%',
              }}
            />
          </div>
          <span className="prog-time r">{duration}</span>
        </div>

        <div className="transport">
          <button
            className={`tbtn${shuffle ? ' on' : ''}`}
            onClick={toggleShuffle}
            title="Shuffle"
          >⇄</button>
          <button className="tbtn" onClick={() => changeSong(false)}>⏮</button>
          <button className="play-btn" onClick={togglePlay}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button className="tbtn" onClick={() => changeSong(true)}>⏭</button>
          <button
            className={`tbtn${loop ? ' on' : ''}`}
            onClick={toggleLoop}
            title="Loop song"
          >↺</button>
        </div>
      </div>
    </div>
  );
}

export default MusicPlayer;
