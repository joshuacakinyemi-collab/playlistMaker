import { useState } from 'react';
import { createSong, searchYouTubeForSong } from '../../adapters/song-adapters.js';

function AddSongForm({ playlist_id, loadSongs }) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [results, setResults] = useState(null);
  const [selected, setSelected] = useState(null);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!title || !author) return;
    setSearching(true);
    setResults(null);
    setSelected(null);
    const { data, error } = await searchYouTubeForSong(title, author);
    setSearching(false);
    if (error) return console.error(error);
    setResults(data || []);
  };

  const handleAdd = async () => {
    if (!title || !author) return;
    const { error } = await createSong(
      playlist_id,
      title,
      author,
      selected?.youtube_id || null,
      selected?.thumbnail || null
    );
    if (error) return console.error(error);
    await loadSongs();
    setTitle('');
    setAuthor('');
    setResults(null);
    setSelected(null);
  };

  const toggleSelect = (result) => {
    setSelected((prev) => (prev?.youtube_id === result.youtube_id ? null : result));
  };

  return (
    <div id="add-song-form">
      <form onSubmit={handleSearch}>
        <label htmlFor="title-input">New Song:</label>
        <input
          type="text"
          id="title-input"
          placeholder="Enter the song name."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="text"
          id="author-input"
          placeholder="Enter the song author."
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <button type="submit" disabled={searching || !title || !author}>
          {searching ? 'Searching...' : 'Search'}
        </button>
      </form>

      {results !== null && (
        <div className="youtube-results">
          {results.length === 0 ? (
            <p className="no-results">No YouTube results found.</p>
          ) : (
            <>
              <p className="results-prompt">Pick the correct video (or add without one):</p>
              <ul className="youtube-result-list">
                {results.map((r) => (
                  <li
                    key={r.youtube_id}
                    className={`youtube-result-item${selected?.youtube_id === r.youtube_id ? ' selected' : ''}`}
                    onClick={() => toggleSelect(r)}
                  >
                    {r.thumbnail && (
                      <img src={r.thumbnail} alt={r.video_title} className="result-thumbnail" />
                    )}
                    <div className="result-info">
                      <p className="result-video-title">{r.video_title}</p>
                      <p className="result-channel">{r.channel}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="add-song-actions">
            <button onClick={handleAdd}>
              {selected ? 'Add Song' : 'Add Without Video'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AddSongForm;
