import { useState, useEffect, useRef } from 'react';
import Visualizer from './components/theme/Visualizer';
import { useTheme } from './ThemeContext';

function loadYoutubeAPI() {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) return resolve();
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);
    window.onYouTubeIframeAPIReady = resolve;
  });
}

function MusicPlayer({ songs }) {
  const { accent } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [loop, setLoop] = useState(false);
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

  const goToIndex = (i) => {
    currentIndexRef.current = i;
    setCurrentIndex(i);
  };

  const toggleShuffle = () => {
    const next = !shuffleRef.current;
    shuffleRef.current = next;
    setShuffle(next);
  };

  const toggleLoop = () => {
    const next = !loopRef.current;
    loopRef.current = next;
    setLoop(next);
  };

  const currentSong = songs[currentIndex];
  const nextIndex = shuffle
    ? Math.floor(Math.random() * songs.length)
    : (currentIndex + 1) % songs.length;
  const nextSong = songs[nextIndex];

  const fetchYoutubeData = async (song) => {
    if (youtubeData[song.song_id]) return youtubeData[song.song_id];
    try {
      const res = await fetch(`/api/songs/${song.song_id}/youtube`);
      if (!res.ok) return null;
      const data = await res.json();
      setYoutubeData((prev) => ({ ...prev, [song.song_id]: data }));
      return data;
    } catch {
      return null;
    }
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
    if (shuffleRef.current) newIndex = Math.floor(Math.random() * songs.length);
    else if (next) newIndex = (idx + 1) % songs.length;
    else newIndex = (idx - 1 + songs.length) % songs.length;
    goToIndex(newIndex);
    initPlayer(songs[newIndex], true);
  };

  const initPlayer = async (song, autoStart = false) => {
    const data = await fetchYoutubeData(song);
    if (!data) return;

    await loadYoutubeAPI();

    if (playerRef.current?.loadVideoById) {
      playerRef.current.loadVideoById(data.youtube_id);
      if (autoStart) playerRef.current.playVideo?.();
      else playerRef.current.pauseVideo?.();
    } else {
      playerRef.current = new window.YT.Player(containerRef.current, {
        height: '0',
        width: '0',
        videoId: data.youtube_id,
        playerVars: { autoplay: 0 },
        events: {
          onReady: (e) => {
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
    startTimeTracking();
  };

  useEffect(() => {
    if (songs.length > 0) initPlayer(songs[0]);
    return () => {
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
          <div className="song-title">{currentSong.title}</div>
          <div className="song-by">{currentSong.author}</div>
          <div className="song-sub">
            {loop
              ? '↺ Looping this song'
              : nextSong && <>Next: {nextSong.title} by {nextSong.author}</>
            }
          </div>
        </div>
      </div>

      <Visualizer isPlaying={isPlaying} accent={accent.color} />

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
            onClick={() => playSong(i)}
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
