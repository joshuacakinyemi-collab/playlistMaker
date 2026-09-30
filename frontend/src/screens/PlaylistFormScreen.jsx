import { useState } from 'react';
import { createPlaylist, updatePlaylist } from '../adapters/playlist-adapters.js';

// New playlist, or (given `playlist`) rename an existing one.
function PlaylistFormScreen({ playlist, onSaved }) {
  const [title, setTitle] = useState(playlist?.title || '');
  const [description, setDescription] = useState(playlist?.description || '');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Give it a title and a description.');
      return;
    }
    const fields = { title: title.trim(), description: description.trim() };
    const { data, error: err } = playlist
      ? await updatePlaylist(playlist.playlist_id, fields)
      : await createPlaylist(fields.title, fields.description);
    if (err) return setError('Could not save the playlist.');
    onSaved(data);
  };

  return (
    <form className="panel form" onSubmit={handleSubmit}>
      <label htmlFor="playlist-title-input">Title</label>
      <input id="playlist-title-input" type="text" placeholder="Road trip" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      <label htmlFor="playlist-description-input">Description</label>
      <input id="playlist-description-input" type="text" placeholder="Songs for the drive" value={description} onChange={(e) => setDescription(e.target.value)} />
      {error && <p className="error">{error}</p>}
      <button type="submit" className="pill primary wide">{playlist ? 'Save' : 'Create Playlist'}</button>
    </form>
  );
}

export default PlaylistFormScreen;
