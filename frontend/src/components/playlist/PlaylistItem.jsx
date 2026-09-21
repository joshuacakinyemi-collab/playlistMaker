import { useState } from 'react';
import { updatePlaylist, deletePlaylist, exportPlaylist } from '../../adapters/playlist-adapters.js';
import { fetchAllSongs } from '../../adapters/song-adapters.js';
import AddSongForm from '../song/AddSongForm.jsx';
import SongList from '../song/SongList.jsx';

function PlaylistItem({ playlist, loadPlaylists, onSelectPlaylist }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(playlist.title);
  const [description, setDescription] = useState(playlist.description);
  const [isExpanded, setIsExpanded] = useState(false);
  const [songs, setSongs] = useState([]);
  const [shareCode, setShareCode] = useState(null);

  const loadSongs = async () => {
    const { data } = await fetchAllSongs(playlist.playlist_id);
    if (data) setSongs(data);
  }

  const handleExpand = async (e) => {
    if (!isExpanded) await loadSongs()
    setIsExpanded((e) => !e)
  }

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!title || !description) return;
    const { error } = await updatePlaylist(playlist.playlist_id, { title, description });
    if (error) return console.error(error);
    await loadPlaylists();
    setIsEditing(false);
  };

  const handleDelete = async () => {
    const { error } = await deletePlaylist(playlist.playlist_id);
    if (error) return console.error(error);
    loadPlaylists();
  };

  const handleShare = async () => {
    const { data, error } = await exportPlaylist(playlist.playlist_id);
    if (error) return console.error(error);
    setShareCode(data);
  };

  if (isEditing) {
    return (
      <li className="playlist-item">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
        <button onClick={handleUpdate}>Save</button>
        <button onClick={() => setIsEditing(false)}>Cancel</button>
      </li>
    );
  }

  return (
    <li className="playlist-item playlist-item--expandable">
      <div className="playlist-item-row">
        <div className="playlist-item-titles">
          <h3>{playlist.title}</h3>
          <h4>{playlist.description}</h4>
        </div>

        <button onClick={handleExpand}>{isExpanded ? '▲' : '▼'} Songs</button>
        <button onClick={() => onSelectPlaylist(playlist)}>▶ Play</button>
        <button onClick={() => setIsEditing(true)}>Edit</button>
        <button onClick={handleShare}>Share</button>
        <button className="delete-btn" onClick={handleDelete}>Delete</button>
      </div>

      {shareCode && (
        <div className="share-code-box">
          <label>Share code — copy and send this to another Playlist Maker user:</label>
          <input type="text" readOnly value={shareCode} onFocus={(e) => e.target.select()} />
          <button onClick={() => setShareCode(null)}>Close</button>
        </div>
      )}

      {isExpanded && (
        <div className="playlist-songs">
          <AddSongForm playlist_id={playlist.playlist_id} loadSongs={loadSongs} />
          <SongList songs={songs} loadSongs={loadSongs} />
        </div>
      )}
    </li>
  );
}



export default PlaylistItem;
