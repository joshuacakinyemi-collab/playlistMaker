import { useState, useEffect } from 'react';
import { fetchAllPlaylists, importPlaylist } from '../../adapters/playlist-adapters.js';
import AddPlaylistForm from './AddPlaylistForm.jsx';
import PlaylistList from './PlaylistList.jsx';

function PlaylistPage({ onSelectPlaylist }) {
  const [playlists, setPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [importCode, setImportCode] = useState('');
  const [importError, setImportError] = useState(null);

  const loadPlaylists = async () => {
    setIsLoading(true);
    setError(null);
    const { data, error: fetchError } = await fetchAllPlaylists();
    if (fetchError) setError(fetchError.message);
    else setPlaylists(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadPlaylists();
  }, []);

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importCode.trim()) return;
    setImportError(null);
    const { error } = await importPlaylist(importCode.trim());
    if (error) return setImportError(error.message);
    setImportCode('');
    loadPlaylists();
  };

  return (
    <div className="library-page">
      <div className="library-panel">
        <div className="library-panel-header">
          <h2>My Library</h2>
        </div>
        <AddPlaylistForm loadPlaylists={loadPlaylists} />
        <form id="import-playlist-form" onSubmit={handleImport}>
          <label htmlFor="import-code-input">Import a shared playlist:</label>
          <input
            type="text"
            id="import-code-input"
            placeholder="Paste a share code"
            value={importCode}
            onChange={(e) => setImportCode(e.target.value)}
          />
          <button type="submit" disabled={!importCode.trim()}>Import</button>
        </form>
        {importError && <p className="error">{importError}</p>}
        {isLoading && <p>Loading playlists...</p>}
        {error && <p className="error">Something went wrong: {error}</p>}
        <PlaylistList
          playlists={playlists}
          loadPlaylists={loadPlaylists}
          onSelectPlaylist={onSelectPlaylist}
        />
      </div>
    </div>
  );
}

export default PlaylistPage;
