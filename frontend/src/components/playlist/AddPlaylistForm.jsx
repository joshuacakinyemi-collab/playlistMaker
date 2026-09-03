import { useState } from 'react';
import { createPlaylist } from '../../adapters/playlist-adapters.js';

function AddPlaylistForm({ loadPlaylists }) {
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const title = form.elements.title.value.trim();
    const description = form.elements.description.value.trim();
    if (!title || !description) return;

    setError(null);
    const { error: err } = await createPlaylist(title, description);
    if (err) { setError('Could not create playlist.'); return; }

    await loadPlaylists();
    form.reset();
  };

  return (
    <form id="add-playlist-form" onSubmit={handleSubmit}>
      <label htmlFor="title-input">New Playlist</label>
      <input type="text" name="title" id="title-input" placeholder="Title" />
      <input type="text" name="description" id="description-input" placeholder="Description" />
      {error && <p className="error">{error}</p>}
      <button type="submit">Add</button>
    </form>
  );
}

export default AddPlaylistForm;
