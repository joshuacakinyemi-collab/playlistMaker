import { useState, useEffect } from 'react';
import { fetchAllSongs } from '../../adapters/song-adapters.js';
import AddSongForm from './AddSongForm.jsx';
import SongList from './SongList.jsx';

function SongPage({ currentUser, handleLogout, playlist_id }) {
  const [songs, setSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // This helper fetches todos on page load with useEffect
  // It is also used within the AddTodoForm and TodoList
  // to re-fetch the todos when a mutation action is performed
  // such as creating, deleting, or updating a todo.
  const loadSongs = async () => {
    setIsLoading(true);
    setError(null);
    const { data, error: fetchError } = await fetchAllSongs(playlist_id);
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setSongs(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadSongs();
  }, []);

  return (
    <section>
      <div id="user-controls">
        <span>Welcome, <strong>{currentUser.username}</strong>!</span>
        <button onClick={handleLogout}>Log Out</button>
      </div>
      <AddSongForm playlist_id={playlist_id} loadSongs={loadSongs} />
      {isLoading && <p>Loading Song...</p>}
      {error && <p className="error">Something went wrong: {error}</p>}
      <SongList songs={songs} loadSongs={loadSongs} />
    </section>
  );
}

export default SongPage;
