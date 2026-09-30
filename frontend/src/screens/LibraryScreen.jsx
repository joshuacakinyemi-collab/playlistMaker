import { useEffect, useState } from 'react';
import { fetchAllPlaylists } from '../adapters/playlist-adapters.js';
import { Menu, MenuRow } from '../components/Menu.jsx';
import { usePlayer } from '../player/PlayerContext.jsx';

const songCount = (n) => `${n} ${n === 1 ? 'song' : 'songs'}`;

// Home screen: every playlist, plus rows to make or import one.
function LibraryScreen({ onOpenPlaylist, onNewPlaylist, onImport }) {
  const player = usePlayer();
  const [playlists, setPlaylists] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      const { data, error: err } = await fetchAllPlaylists();
      if (err) setError(err.message);
      else setPlaylists(data);
    };
    load();
  }, []);

  if (error) return <p className="error screen-message">Something went wrong: {error}</p>;
  if (!playlists) return <p className="muted screen-message">Loading playlists…</p>;

  return (
    <>
      <Menu label="Playlists">
        {playlists.length === 0 && (
          <li className="menu-empty">No playlists yet — make your first one below.</li>
        )}
        {playlists.map((pl) => {
          const isCurrent = player.playlist?.playlist_id === pl.playlist_id;
          return (
            <MenuRow
              key={pl.playlist_id}
              icon={isCurrent && player.isPlaying ? '►' : '♫'}
              title={pl.title}
              detail={`${songCount(pl.songs.length)}${pl.description ? ` · ${pl.description}` : ''}`}
              active={isCurrent}
              onClick={() => onOpenPlaylist(pl)}
            />
          );
        })}
      </Menu>

      <Menu>
        <MenuRow icon="+" title="New Playlist" onClick={onNewPlaylist} />
        <MenuRow icon="⇩" title="Import a Shared Playlist" onClick={onImport} />
      </Menu>
    </>
  );
}

export default LibraryScreen;
