import { useState, useEffect } from 'react';
import { fetchAllPlaylists } from '../../adapters/playlist-adapters.js';
import { fetchFavorites, removeFavorite } from '../../adapters/favorite-adapters.js';
import AddPlaylistForm from './AddPlaylistForm.jsx';
import PlaylistList from './PlaylistList.jsx';

function PlaylistPage({ currentUser, handleLogout, onSelectPlaylist }) {
  const [playlists, setPlaylists] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadPlaylists = async () => {
    setIsLoading(true);
    setError(null);
    const { data, error: fetchError } = await fetchAllPlaylists();
    if (fetchError) setError(fetchError.message);
    else setPlaylists(data);
    setIsLoading(false);
  };

  const loadFavorites = async () => {
    const { data } = await fetchFavorites();
    if (data) setFavorites(data);
  };

  useEffect(() => {
    loadPlaylists();
    loadFavorites();
  }, []);

  const handleUnfavorite = async (e, playlist_id) => {
    e.stopPropagation();
    await removeFavorite(playlist_id);
    loadFavorites();
  };

  return (
    <div className="library-page">
      <div className="library-panel">
        <div className="library-panel-header">
          <h2>My Library</h2>
        </div>
        <AddPlaylistForm loadPlaylists={loadPlaylists} />
        {isLoading && <p>Loading playlists...</p>}
        {error && <p className="error">Something went wrong: {error}</p>}
        <PlaylistList
          playlists={playlists}
          loadPlaylists={loadPlaylists}
          onSelectPlaylist={onSelectPlaylist}
        />
      </div>

      {favorites.length > 0 && (
        <div className="favorites-panel">
          <div className="library-panel-header favorites-panel-header">
            <h2>Favorites</h2>
          </div>
          <ul className="favorited-list">
            {favorites.map((playlist) => (
              <li
                key={playlist.playlist_id}
                className="playlist-item favorited-item"
                onClick={() => onSelectPlaylist(playlist)}
                style={{ cursor: 'pointer' }}
              >
                <div className="playlist-item-titles" style={{ flex: 1 }}>
                  <h3>{playlist.title}</h3>
                  <p style={{ padding: 0 }}>{playlist.description}</p>
                  <span className="playlist-creator">by {playlist.created_by}</span>
                </div>
                <button
                  className="favorite-btn favorited"
                  onClick={(e) => handleUnfavorite(e, playlist.playlist_id)}
                  title="Unfavorite"
                >
                  ♥
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default PlaylistPage;
