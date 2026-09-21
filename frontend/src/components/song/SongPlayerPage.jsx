import { useEffect, useState } from 'react';
import { fetchAllSongs } from '../../adapters/song-adapters.js';
import { fetchAllPlaylists } from '../../adapters/playlist-adapters.js';
import MusicPlayer from '../../music.jsx';

function SongPlayerPage({ playlist, onBack, onSelectPlaylist }) {
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allPlaylists, setAllPlaylists] = useState([]);

  useEffect(() => {
    const loadSongs = async () => {
      setSongs([])
      setIsLoading(true);
      setError(null)
      const { data, error: fetchError } = await fetchAllSongs(playlist.playlist_id);
      if (fetchError) setError(fetchError.message);
      else setSongs(data);
      setIsLoading(false);
    };
    loadSongs();
  }, [playlist.playlist_id]);

  // Powers the player's built-in playlist switcher — fetched once, not
  // tied to which playlist is currently open.
  useEffect(() => {
    const loadPlaylists = async () => {
      const { data } = await fetchAllPlaylists();
      if (data) setAllPlaylists(data);
    };
    loadPlaylists();
  }, []);

  if (isLoading) return <p>Loading songs...</p>;
  if (error) return <p className="error">Something went wrong: {error}</p>;

  return (
    <section className="song-page">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <div className="song-page-header">
        <div className="song-page-meta">
          <h2>{playlist.title}</h2>
          <p className="song-page-desc">{playlist.description}</p>
        </div>
      </div>
      {songs.length > 0
        ? (
          <MusicPlayer
            key={playlist.playlist_id}
            songs={songs}
            playlists={allPlaylists}
            currentPlaylistId={playlist.playlist_id}
            onSwitchPlaylist={onSelectPlaylist}
          />
        )
        : <p>No songs in this playlist yet.</p>
      }
    </section>
  );
}


export default SongPlayerPage;
