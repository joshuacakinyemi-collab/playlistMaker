import { useEffect, useState } from 'react';
import { fetchPublicPlaylists } from '../../adapters/playlist-adapters.js';
import { fetchFavoriteIds, addFavorite, removeFavorite } from '../../adapters/favorite-adapters.js';

function PublicPlaylistPage({ setSelectedPlaylist, currentUser }) {
  const [playlists, setPlaylists] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [titleQuery, setTitleQuery] = useState('');
  const [creatorFilter, setCreatorFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const filtered = playlists.filter((p) => {
    const matchesTitle = p.title.toLowerCase().includes(titleQuery.toLowerCase());
    const matchesCreator = p.created_by.toLowerCase().includes(creatorFilter.toLowerCase());
    return matchesTitle && matchesCreator;
  });

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const { data, error: fetchError } = await fetchPublicPlaylists();
      if (fetchError) setError(fetchError.message);
      else setPlaylists(data);
      setIsLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const loadIds = async () => {
      const { data } = await fetchFavoriteIds();
      if (data) setFavoriteIds(new Set(data));
    };
    loadIds();
  }, [currentUser]);

  const toggleFavorite = async (e, playlist_id) => {
    e.stopPropagation();
    if (!currentUser) return;
    const isFaved = favoriteIds.has(playlist_id);
    // Optimistic update
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      isFaved ? next.delete(playlist_id) : next.add(playlist_id);
      return next;
    });
    const { error } = isFaved
      ? await removeFavorite(playlist_id)
      : await addFavorite(playlist_id);
    if (error) {
      // Revert on failure
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        isFaved ? next.add(playlist_id) : next.delete(playlist_id);
        return next;
      });
    }
  };

  if (isLoading) return <p>Loading playlists...</p>;
  if (error) return <p className="error">Something went wrong: {error}</p>;

  return (
    <section>
      <h2>Public Playlists</h2>

      <div className="playlist-filters">
        <input
          className="sidebar-search"
          placeholder="Search by name..."
          value={titleQuery}
          onChange={(e) => setTitleQuery(e.target.value)}
        />
        <input
          className="sidebar-search"
          placeholder="Filter by creator..."
          value={creatorFilter}
          onChange={(e) => setCreatorFilter(e.target.value)}
        />
        {creatorFilter && (
          <button className="clear-filter-btn" onClick={() => setCreatorFilter('')}>
            ✕ {creatorFilter}
          </button>
        )}
      </div>

      {filtered.length === 0 && (titleQuery || creatorFilter) && (
        <p>No playlists found.</p>
      )}

      <ul id="public-playlist-list">
        {filtered.map((playlist) => (
          <li
            key={playlist.playlist_id}
            className="playlist-item"
            onClick={() => setSelectedPlaylist(playlist)}
            style={{ cursor: 'pointer' }}
          >
            <div className="playlist-item-titles" style={{ flex: 1 }}>
              <h3>{playlist.title}</h3>
              <p style={{ padding: 0 }}>{playlist.description}</p>
              <button
                className="creator-tag"
                onClick={(e) => {
                  e.stopPropagation();
                  setCreatorFilter(playlist.created_by);
                }}
              >
                by {playlist.created_by}
              </button>
            </div>

            {currentUser && (
              <button
                className={`favorite-btn${favoriteIds.has(playlist.playlist_id) ? ' favorited' : ''}`}
                onClick={(e) => toggleFavorite(e, playlist.playlist_id)}
                title={favoriteIds.has(playlist.playlist_id) ? 'Unfavorite' : 'Favorite'}
              >
                {favoriteIds.has(playlist.playlist_id) ? '♥' : '♡'}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default PublicPlaylistPage;
