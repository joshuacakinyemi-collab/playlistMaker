import { useEffect, useRef, useState } from 'react';
import { fetchAllSongs, updateSong, deleteSong } from '../adapters/song-adapters.js';
import { deletePlaylist, exportPlaylist } from '../adapters/playlist-adapters.js';
import { Menu, MenuRow } from '../components/Menu.jsx';
import { usePlayer } from '../player/PlayerContext.jsx';

// One playlist: its tracks (tap one to play from there) and everything you
// can do to it. Opening a playlist that isn't already playing starts it.
function PlaylistScreen({ playlist, onAddSong, onEdit, onDeleted, onOpenNowPlaying }) {
  const player = usePlayer();
  const [songs, setSongs] = useState(null);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [shareCode, setShareCode] = useState(null);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const autoplayedRef = useRef(false);

  const isCurrent = player.playlist?.playlist_id === playlist.playlist_id;

  const loadSongs = async () => {
    const { data, error: err } = await fetchAllSongs(playlist.playlist_id);
    if (err) {
      setError(err.message);
      return null;
    }
    setSongs(data);
    return data;
  };

  useEffect(() => {
    const load = async () => {
      const data = await loadSongs();
      if (!data || autoplayedRef.current) return;
      autoplayedRef.current = true;
      if (player.playlist?.playlist_id !== playlist.playlist_id) {
        player.playQueue(playlist, data, 0);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlist.playlist_id]);

  // Reload after an edit, and keep the player's queue in step if this is
  // the playlist that's playing.
  const refresh = async () => {
    const data = await loadSongs();
    if (data) player.syncQueue(playlist.playlist_id, data);
  };

  const handleShare = async () => {
    const { data, error: err } = await exportPlaylist(playlist.playlist_id);
    if (err) return setError(err.message);
    setShareCode(data);
    setCopied(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareCode);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    const { error: err } = await deletePlaylist(playlist.playlist_id);
    if (err) return setError(err.message);
    if (isCurrent) player.stop();
    onDeleted();
  };

  const playFrom = (index) => {
    if (isCurrent) player.playIndex(index);
    else player.playQueue(playlist, songs, index);
    onOpenNowPlaying();
  };

  if (error) return <p className="error screen-message">Something went wrong: {error}</p>;
  if (!songs) return <p className="muted screen-message">Loading songs…</p>;

  return (
    <>
      <header className="playlist-header">
        <div className="playlist-cover" aria-hidden="true">
          {songs.find((s) => s.thumbnail)
            ? <img src={songs.find((s) => s.thumbnail).thumbnail} alt="" />
            : '♫'}
        </div>
        <div className="playlist-info">
          <h2>{playlist.title}</h2>
          {playlist.description && <p className="muted">{playlist.description}</p>}
          <p className="muted small">{songs.length} {songs.length === 1 ? 'song' : 'songs'}</p>
        </div>
      </header>

      <div className="action-bar">
        <button type="button" className="pill primary" disabled={!songs.length} onClick={() => playFrom(0)}>► Play</button>
        <button
          type="button"
          className="pill"
          disabled={!songs.length}
          onClick={() => {
            player.playQueue(playlist, songs, 0, { shuffled: true });
            onOpenNowPlaying();
          }}
        >⇄ Shuffle</button>
        <button type="button" className="pill" onClick={onAddSong}>+ Add Song</button>
        <button type="button" className="pill" onClick={onEdit}>✎ Edit</button>
        <button type="button" className="pill" onClick={handleShare}>⤴ Share</button>
        <button
          type="button"
          className={`pill danger${confirmDelete ? ' confirm' : ''}`}
          onClick={handleDelete}
          onBlur={() => setConfirmDelete(false)}
        >{confirmDelete ? 'Tap again to delete' : 'Delete'}</button>
      </div>

      {shareCode && (
        <div className="panel share-panel">
          <label htmlFor="share-code">Share code — send this to another Playlist Maker user:</label>
          <input id="share-code" type="text" readOnly value={shareCode} onFocus={(e) => e.target.select()} />
          <div className="panel-actions">
            <button type="button" className="pill primary" onClick={handleCopy}>{copied ? '✓ Copied' : 'Copy'}</button>
            <button type="button" className="pill" onClick={() => setShareCode(null)}>Close</button>
          </div>
        </div>
      )}

      <Menu label="Tracks">
        {songs.length === 0 && (
          <li className="menu-empty">No songs yet — add one with “+ Add Song”.</li>
        )}
        {songs.map((song, i) => {
          const isPlayingRow = isCurrent && player.currentSong?.song_id === song.song_id;
          if (editingId === song.song_id) {
            return (
              <SongEditRow
                key={song.song_id}
                song={song}
                onCancel={() => setEditingId(null)}
                onSaved={async () => {
                  setEditingId(null);
                  await refresh();
                }}
              />
            );
          }
          return (
            <MenuRow
              key={song.song_id}
              icon={isPlayingRow ? (player.isPlaying ? '►' : '||') : i + 1}
              title={song.title}
              detail={song.author}
              active={isPlayingRow}
              chevron={false}
              onClick={() => playFrom(i)}
              trailing={
                <button
                  type="button"
                  className="row-action"
                  title={`Edit “${song.title}”`}
                  onClick={() => setEditingId(song.song_id)}
                >⋯</button>
              }
            />
          );
        })}
      </Menu>
    </>
  );
}

// Inline editor that replaces a track row: rename it, or delete it.
function SongEditRow({ song, onCancel, onSaved }) {
  const [title, setTitle] = useState(song.title);
  const [author, setAuthor] = useState(song.author);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;
    const { error: err } = await updateSong(song.song_id, { title: title.trim(), author: author.trim() });
    if (err) return setError('Could not update song.');
    onSaved();
  };

  const remove = async () => {
    if (!confirmDelete) return setConfirmDelete(true);
    const { error: err } = await deleteSong(song.song_id);
    if (err) return setError('Could not delete song.');
    onSaved();
  };

  return (
    <li className="menu-item editing">
      <form className="song-edit" onSubmit={save}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" aria-label="Song title" autoFocus />
        <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Artist" aria-label="Artist" />
        {error && <p className="error">{error}</p>}
        <div className="panel-actions">
          <button type="submit" className="pill primary">Save</button>
          <button type="button" className="pill" onClick={onCancel}>Cancel</button>
          <button
            type="button"
            className={`pill danger${confirmDelete ? ' confirm' : ''}`}
            onClick={remove}
            onBlur={() => setConfirmDelete(false)}
          >{confirmDelete ? 'Tap again to delete' : 'Delete'}</button>
        </div>
      </form>
    </li>
  );
}

export default PlaylistScreen;
