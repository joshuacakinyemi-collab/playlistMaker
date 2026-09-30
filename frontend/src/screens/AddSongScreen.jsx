import { useState } from 'react';
import { createSong, fetchAllSongs, searchYouTubeForSong } from '../adapters/song-adapters.js';
import { usePlayer } from '../player/PlayerContext.jsx';

// Search YouTube for a song, pick the right video, add it to the playlist.
function AddSongScreen({ playlist, onDone }) {
  const player = usePlayer();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [results, setResults] = useState(null);
  const [selected, setSelected] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;
    setSearching(true);
    setError(null);
    setResults(null);
    setSelected(null);
    const { data, error: err } = await searchYouTubeForSong(title.trim(), author.trim());
    setSearching(false);
    if (err) return setError(err.message.replace(/^Error invoking remote method '[^']+': (Error: )?/, ''));
    setResults(data || []);
  };

  const handleAdd = async () => {
    const { error: err } = await createSong(
      playlist.playlist_id,
      title.trim(),
      author.trim(),
      selected?.youtube_id || null,
      selected?.thumbnail || null
    );
    if (err) return setError('Could not add the song.');
    const { data } = await fetchAllSongs(playlist.playlist_id);
    if (data) player.syncQueue(playlist.playlist_id, data);
    onDone();
  };

  return (
    <>
      <form className="panel form" onSubmit={handleSearch}>
        <label htmlFor="song-title-input">Song</label>
        <input id="song-title-input" type="text" placeholder="Song name" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        <label htmlFor="song-author-input">Artist</label>
        <input id="song-author-input" type="text" placeholder="Artist" value={author} onChange={(e) => setAuthor(e.target.value)} />
        {error && <p className="error">{error}</p>}
        <button type="submit" className="pill primary wide" disabled={searching || !title.trim() || !author.trim()}>
          {searching ? 'Searching…' : 'Search YouTube'}
        </button>
      </form>

      {results !== null && (
        <div className="menu-group">
          <div className="menu-label">{results.length ? 'Pick the right video' : 'No YouTube results found'}</div>
          <ul className="menu">
            {results.map((r) => {
              const isSelected = selected?.youtube_id === r.youtube_id;
              return (
                <li key={r.youtube_id} className={`menu-item${isSelected ? ' active' : ''}`}>
                  <button
                    type="button"
                    className="menu-row result-row"
                    aria-pressed={isSelected}
                    onClick={() => setSelected(isSelected ? null : r)}
                  >
                    {r.thumbnail && <img className="result-thumb" src={r.thumbnail} alt="" />}
                    <span className="menu-text">
                      <span className="menu-title">{r.video_title}</span>
                      <span className="menu-detail">{r.channel}</span>
                    </span>
                    <span className="menu-check" aria-hidden="true">{isSelected ? '✓' : ''}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <button type="button" className="pill primary wide add-song-btn" onClick={handleAdd}>
            {selected ? 'Add Song' : 'Add Without a Video'}
          </button>
        </div>
      )}
    </>
  );
}

export default AddSongScreen;
