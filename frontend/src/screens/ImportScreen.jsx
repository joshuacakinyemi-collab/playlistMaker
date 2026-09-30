import { useState } from 'react';
import { importPlaylist } from '../adapters/playlist-adapters.js';

// Paste a share code from another Playlist Maker user.
function ImportScreen({ onImported }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setError(null);
    const { data, error: err } = await importPlaylist(code.trim());
    if (err) return setError(err.message.replace(/^Error invoking remote method '[^']+': (Error: )?/, ''));
    onImported(data);
  };

  return (
    <form className="panel form" onSubmit={handleSubmit}>
      <label htmlFor="import-code-input">Share code</label>
      <p className="muted small">Ask a friend to press Share on one of their playlists, then paste the code here.</p>
      <input id="import-code-input" type="text" placeholder="Paste a share code" value={code} onChange={(e) => setCode(e.target.value)} autoFocus />
      {error && <p className="error">{error}</p>}
      <button type="submit" className="pill primary wide" disabled={!code.trim()}>Import</button>
    </form>
  );
}

export default ImportScreen;
