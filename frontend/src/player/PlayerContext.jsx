import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { resolveSongYoutube } from '../adapters/song-adapters.js';
import { registerGamepadActions } from '../gamepad.js';

// The app-wide music engine. It lives above every screen, so a song keeps
// playing while you browse playlists, add songs or change settings — like a
// real media player — and every screen (Now Playing, the mini player bar,
// a playlist's track list) reads and drives the same queue.
//
// Playback itself is a hidden YouTube IFrame player. Its callbacks are set
// up once, so everything they need is mirrored into refs.

const PlayerContext = createContext(null);

function loadYoutubeAPI() {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) return resolve();
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    }
  });
}

const ERROR_MESSAGES = {
  // 101/150: the owner doesn't allow playback outside youtube.com.
  101: "This video's owner doesn't allow it to play outside YouTube. Try picking a different video for this song.",
  150: "This video's owner doesn't allow it to play outside YouTube. Try picking a different video for this song.",
};
const GENERIC_ERROR = "This video can't be played (it may be private or removed).";

// Every index except `startIndex`, shuffled, with `startIndex` first (if
// given). Walked one step at a time so every song plays once before any
// song repeats.
function buildShuffleOrder(length, startIndex) {
  const rest = [...Array(length).keys()].filter((i) => i !== startIndex);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return startIndex === undefined ? rest : [startIndex, ...rest];
}

export function PlayerProvider({ children }) {
  const [playlist, setPlaylist] = useState(null);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [loop, setLoop] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [art, setArt] = useState(null);
  const [error, setError] = useState(null);

  const queueRef = useRef([]);
  const indexRef = useRef(-1);
  const shuffleRef = useRef(false);
  const loopRef = useRef(false);
  const shuffleOrderRef = useRef([]);
  const shufflePosRef = useRef(0);

  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const playerReadyRef = useRef(null);
  const youtubeCacheRef = useRef({});
  // Bumped on every song change; an older, slower load that finishes after
  // a newer one sees the mismatch and gives up instead of clobbering it.
  const loadTokenRef = useRef(0);

  const setQueueState = (songs) => {
    queueRef.current = songs;
    setQueue(songs);
  };

  const setIndexState = (i) => {
    indexRef.current = i;
    setCurrentIndex(i);
  };

  // Creates the one hidden YouTube player on first use and resolves once
  // it's ready for commands.
  const getPlayer = () => {
    if (!playerReadyRef.current) {
      playerReadyRef.current = loadYoutubeAPI().then(
        () =>
          new Promise((resolve) => {
            // YT.Player replaces the element it's given with an iframe, so
            // hand it a throwaway child rather than a React-owned node.
            const mount = document.createElement('div');
            hostRef.current.appendChild(mount);
            playerRef.current = new window.YT.Player(mount, {
              height: '0',
              width: '0',
              playerVars: { autoplay: 0 },
              events: {
                onReady: (e) => resolve(e.target),
                onError: (e) => {
                  setIsPlaying(false);
                  setError(ERROR_MESSAGES[e.data] || GENERIC_ERROR);
                },
                onStateChange: (e) => {
                  const { PLAYING, ENDED } = window.YT.PlayerState;
                  if (e.data === PLAYING) setError(null);
                  setIsPlaying(e.data === PLAYING);
                  if (e.data === ENDED) {
                    if (loopRef.current) {
                      e.target.seekTo(0);
                      e.target.playVideo();
                    } else {
                      step(1);
                    }
                  }
                },
              },
            });
          })
      );
    }
    return playerReadyRef.current;
  };

  const loadSong = async (index, autoStart = true) => {
    const song = queueRef.current[index];
    if (!song) return;
    const token = ++loadTokenRef.current;
    setIndexState(index);
    setError(null);
    setCurrentTime(0);
    setDuration(0);
    setArt(song.thumbnail || youtubeCacheRef.current[song.song_id]?.thumbnail || null);

    let data = song.youtube_id ? { youtube_id: song.youtube_id, thumbnail: song.thumbnail } : null;
    data = data || youtubeCacheRef.current[song.song_id];
    if (!data) {
      const { data: resolved } = await resolveSongYoutube(song.song_id);
      if (token !== loadTokenRef.current) return;
      if (!resolved) {
        setIsPlaying(false);
        setError("Couldn't find a YouTube video for this song.");
        return;
      }
      youtubeCacheRef.current[song.song_id] = resolved;
      data = resolved;
      setArt(resolved.thumbnail || null);
    }

    const player = await getPlayer();
    if (token !== loadTokenRef.current) return;
    if (autoStart) player.loadVideoById(data.youtube_id);
    else player.cueVideoById(data.youtube_id);
  };

  // Moves forward (+1) or back (-1) through the queue, walking the shuffle
  // order when shuffle is on.
  const step = (direction) => {
    const length = queueRef.current.length;
    if (!length) return;
    let nextIndex;
    if (shuffleRef.current) {
      if (shuffleOrderRef.current.length !== length) {
        shuffleOrderRef.current = buildShuffleOrder(length, indexRef.current);
        shufflePosRef.current = 0;
      }
      let pos = shufflePosRef.current + direction;
      if (pos >= length) {
        // Played through every song — reshuffle and start the bag over.
        shuffleOrderRef.current = buildShuffleOrder(length);
        pos = 0;
      } else if (pos < 0) {
        pos = length - 1;
      }
      shufflePosRef.current = pos;
      nextIndex = shuffleOrderRef.current[pos];
    } else {
      nextIndex = (indexRef.current + direction + length) % length;
    }
    loadSong(nextIndex);
  };

  // Starts `songs` (a playlist's tracks) from `startIndex`.
  const playQueue = (nextPlaylist, songs, startIndex = 0, { shuffled = false } = {}) => {
    if (!songs.length) return;
    setPlaylist(nextPlaylist);
    setQueueState(songs);
    shuffleRef.current = shuffled || shuffleRef.current;
    setShuffle(shuffleRef.current);
    let first = startIndex;
    if (shuffleRef.current) {
      first = shuffled ? Math.floor(Math.random() * songs.length) : startIndex;
      shuffleOrderRef.current = buildShuffleOrder(songs.length, first);
      shufflePosRef.current = 0;
    }
    loadSong(first);
  };

  // Jump to a song in the current queue (e.g. tapping a track).
  const playIndex = (index) => {
    if (shuffleRef.current) {
      const pos = shuffleOrderRef.current.indexOf(index);
      if (pos !== -1) shufflePosRef.current = pos;
      else {
        shuffleOrderRef.current = buildShuffleOrder(queueRef.current.length, index);
        shufflePosRef.current = 0;
      }
    }
    loadSong(index);
  };

  // Keeps the queue in step with edits to the playlist that's playing
  // (a song added, renamed or deleted) without interrupting the current
  // song — unless the current song itself was deleted.
  const syncQueue = (playlistId, songs) => {
    if (!playlist || playlist.playlist_id !== playlistId) return;
    const current = queueRef.current[indexRef.current];
    setQueueState(songs);
    shuffleOrderRef.current = [];
    const stillThere = current ? songs.findIndex((s) => s.song_id === current.song_id) : -1;
    if (stillThere !== -1) {
      setIndexState(stillThere);
    } else if (songs.length) {
      loadSong(Math.min(indexRef.current, songs.length - 1));
    } else {
      stop();
    }
  };

  const updatePlaylistInfo = (updated) => {
    if (playlist && playlist.playlist_id === updated.playlist_id) setPlaylist(updated);
  };

  const stop = () => {
    loadTokenRef.current++;
    playerRef.current?.stopVideo?.();
    setPlaylist(null);
    setQueueState([]);
    setIndexState(-1);
    setIsPlaying(false);
    setError(null);
  };

  const togglePlay = () => {
    const player = playerRef.current;
    if (!player?.getPlayerState) return;
    if (player.getPlayerState() === window.YT.PlayerState.PLAYING) player.pauseVideo();
    else player.playVideo();
  };

  const seekTo = (fraction) => {
    const player = playerRef.current;
    if (!player?.getDuration) return;
    player.seekTo(fraction * player.getDuration(), true);
    setCurrentTime(fraction * player.getDuration());
  };

  const toggleShuffle = () => {
    const next = !shuffleRef.current;
    shuffleRef.current = next;
    setShuffle(next);
    if (next) {
      shuffleOrderRef.current = buildShuffleOrder(queueRef.current.length, indexRef.current);
      shufflePosRef.current = 0;
    }
  };

  const toggleLoop = () => {
    loopRef.current = !loopRef.current;
    setLoop(loopRef.current);
  };

  // Progress clock — polled because the IFrame API has no time events.
  useEffect(() => {
    const id = setInterval(() => {
      const player = playerRef.current;
      if (!player?.getCurrentTime) return;
      setCurrentTime(player.getCurrentTime() || 0);
      setDuration(player.getDuration() || 0);
    }, 500);
    return () => clearInterval(id);
  }, []);

  // Controller X = play/pause, bumpers = prev/next, on every screen.
  // Everything these call reads refs, so registering once is safe.
  useEffect(
    () =>
      registerGamepadActions({
        onX: togglePlay,
        onNext: () => step(1),
        onPrev: () => step(-1),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const currentSong = queue[currentIndex] || null;
  let nextSong = null;
  if (queue.length > 1 && currentSong) {
    if (shuffle && shuffleOrderRef.current.length === queue.length) {
      const peek = shuffleOrderRef.current[shufflePosRef.current + 1];
      nextSong = peek === undefined ? null : queue[peek];
    } else {
      nextSong = queue[(currentIndex + 1) % queue.length];
    }
  }

  const value = {
    playlist,
    queue,
    currentIndex,
    currentSong,
    nextSong,
    isPlaying,
    shuffle,
    loop,
    currentTime,
    duration,
    art,
    error,
    playQueue,
    playIndex,
    syncQueue,
    updatePlaylistInfo,
    stop,
    togglePlay,
    next: () => step(1),
    prev: () => step(-1),
    seekTo,
    toggleShuffle,
    toggleLoop,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <div ref={hostRef} className="yt-host" aria-hidden="true" />
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => useContext(PlayerContext);

export function formatTime(seconds) {
  if (!seconds || Number.isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
