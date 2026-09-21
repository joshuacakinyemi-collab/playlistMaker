import { useState, useEffect } from 'react';
import { getSettings, setSettings } from '../adapters/settings-adapters.js';

function SettingsModal({ onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await getSettings();
      if (data) setApiKey(data.youtubeApiKey || '');
    };
    load();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const { error: err } = await setSettings({ youtubeApiKey: apiKey.trim() });
    if (err) return setError('Could not save settings.');
    setSaved(true);
  };

  return (
    <div className="settings-modal-backdrop" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-modal-header">
          <h2>Settings</h2>
          <button className="playlist-panel-close" onClick={onClose} aria-label="Close settings">✕</button>
        </div>

        <form onSubmit={handleSave}>
          <label htmlFor="youtube-api-key-input">YouTube API key</label>
          <p className="settings-modal-hint">
            Used to search YouTube for songs you add. Get a free key from the Google Cloud Console
            (enable the "YouTube Data API v3") and paste it here — it's stored only on this device.
          </p>
          <input
            type="text"
            id="youtube-api-key-input"
            placeholder="Paste your YouTube API key"
            value={apiKey}
            onChange={(e) => { setApiKey(e.target.value); setSaved(false); }}
          />
          {error && <p className="error">{error}</p>}
          {saved && <p className="settings-modal-saved">Saved.</p>}
          <button type="submit" className="wmp-glossy-btn small">Save</button>
        </form>
      </div>
    </div>
  );
}

export default SettingsModal;
