import { useState } from 'react';
import { updateSong, deleteSong } from '../../adapters/song-adapters.js';

function SongItem({ song, loadSongs }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(song.title);
  const [author, setAuthor] = useState(song.author);
  const [error, setError] = useState(null);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!title || !author) return;
    setError(null);
    const { error: err } = await updateSong(song.song_id, { title, author });
    if (err) { setError('Could not update song.'); return; }
    await loadSongs();
    setIsEditing(false);
  };

  const handleDelete = async () => {
    const { error: err } = await deleteSong(song.song_id);
    if (err) { setError('Could not delete song.'); return; }
    loadSongs();
  };

  if (isEditing) {
    return (
      <li className="song-item">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
        <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author" />
        {error && <span className="error">{error}</span>}
        <button onClick={handleUpdate}>Save</button>
        <button onClick={() => { setIsEditing(false); setError(null); }}>Cancel</button>
      </li>
    );
  }

  return (
    <li className="song-item">
      <h3>{song.title}</h3>
      <h4>{song.author}</h4>
      {error && <span className="error">{error}</span>}
      <button onClick={() => setIsEditing(true)}>Edit</button>
      <button className="delete-btn" onClick={handleDelete}>Delete</button>
    </li>
  );
}

export default SongItem;
