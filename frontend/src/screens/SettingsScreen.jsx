import { useEffect, useState } from 'react';
import { getSettings, setSettings } from '../adapters/settings-adapters.js';
import { Menu, MenuRow } from '../components/Menu.jsx';
import { useTheme } from '../ThemeContext.jsx';
import PocketPlayerIcon from '../components/PocketPlayerIcon.jsx';

function SettingsScreen({ mp3Mode, onToggleMp3Mode }) {
  const { isDark, toggleMode, accentIndex, setAccent, ACCENTS, CUSTOM, customColor, setCustomColor, tintArt, toggleTintArt } = useTheme();
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
    <>
      <Menu label="Player">
        <MenuRow
          icon={<PocketPlayerIcon size={16} />}
          title="MP3 Player Mode"
          detail={mp3Mode ? 'On — shrinks the window to a pocket player' : 'Off — shrink the window to a pocket player'}
          chevron={false}
          onClick={onToggleMp3Mode}
          trailing={<span className={`switch${mp3Mode ? ' on' : ''}`} aria-hidden="true" />}
          aria-pressed={mp3Mode}
        />
      </Menu>

      <Menu label="Appearance">
        <MenuRow
          icon={isDark ? '☾' : '☀'}
          title="Dark Mode"
          detail={isDark ? 'On' : 'Off'}
          chevron={false}
          onClick={toggleMode}
          trailing={<span className={`switch${isDark ? ' on' : ''}`} aria-hidden="true" />}
          aria-pressed={isDark}
        />
        <li className="menu-item swatch-row">
          <span className="menu-icon" aria-hidden="true">◐</span>
          <span className="menu-text"><span className="menu-title">Color</span></span>
          <span className="swatches">
            {ACCENTS.map((a, i) => (
              <button
                key={a.label}
                type="button"
                className={`swatch${i === accentIndex ? ' selected' : ''}`}
                style={{ background: a.color }}
                title={a.label}
                aria-label={`${a.label} color`}
                aria-pressed={i === accentIndex}
                onClick={() => setAccent(i)}
              />
            ))}
            {/* The last swatch is your own color: opens the system color picker. */}
            <input
              type="color"
              className={`swatch swatch-custom${accentIndex === CUSTOM ? ' selected' : ''}`}
              value={customColor}
              title="Custom color"
              aria-label="Custom color"
              onClick={() => setCustomColor(customColor)}
              onChange={(e) => setCustomColor(e.target.value)}
            />
          </span>
        </li>
        <MenuRow
          icon="▣"
          title="Tint Artwork"
          detail={tintArt ? 'On — artwork shown in the theme color' : 'Off — artwork shown in its real colors'}
          chevron={false}
          onClick={toggleTintArt}
          trailing={<span className={`switch${tintArt ? ' on' : ''}`} aria-hidden="true" />}
          aria-pressed={tintArt}
        />
      </Menu>

      <form className="panel form" onSubmit={handleSave}>
        <label htmlFor="youtube-api-key-input">YouTube API key</label>
        <p className="muted small">
          Used to search YouTube for songs you add. Get a free key from the Google Cloud Console
          (enable the “YouTube Data API v3”) and paste it here. It's stored only on this device.
        </p>
        <input
          type="text"
          id="youtube-api-key-input"
          placeholder="Paste your YouTube API key"
          value={apiKey}
          onChange={(e) => { setApiKey(e.target.value); setSaved(false); }}
        />
        {error && <p className="error">{error}</p>}
        {saved && <p className="saved-note">✓ Saved</p>}
        <button type="submit" className="pill primary wide">Save Key</button>
      </form>
    </>
  );
}

export default SettingsScreen;
