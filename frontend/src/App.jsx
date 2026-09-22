import { useState, useEffect } from 'react';
import PlaylistPage from './components/playlist/PlaylistPage';
import SongPlayerPage from './components/song/SongPlayerPage';
import SettingsModal from './components/SettingsModal';
import GamepadKeyboard from './components/GamepadKeyboard';
import ThemeControls from './components/theme/ThemeControls';
import logo from './assets/logo.png';
import { registerGamepadActions } from './gamepad.js';

function App() {
  const [selectedPlaylist, setSelectedPlaylist] = useState(
    () => {
      const saved = sessionStorage.getItem('selectedPlaylist');
      return saved ? JSON.parse(saved) : null;
    }
  );

  const [settingsOpen, setSettingsOpen] = useState(false);

  const selectPlaylist = (playlist) => {
    if (playlist) {
      sessionStorage.setItem('selectedPlaylist', JSON.stringify(playlist));
    } else {
      sessionStorage.removeItem('selectedPlaylist');
    }
    setSelectedPlaylist(playlist);
  };

  const goHome = () => selectPlaylist(null);

  // B button: close Settings if it's open, else back out of the player to
  // the library. Start button: toggle Settings. Re-registered whenever
  // this state changes so the handlers never act on stale values.
  useEffect(() => {
    return registerGamepadActions({
      onBack: () => {
        if (settingsOpen) setSettingsOpen(false);
        else if (selectedPlaylist) selectPlaylist(null);
      },
      onStart: () => setSettingsOpen((open) => !open),
    });
  }, [settingsOpen, selectedPlaylist]);

  return (
    <div className="wmp-app">
      <div className="wmp-titlebar">
        <div className="wmp-title">
          <img className="wmp-title-icon" src={logo} alt="" aria-hidden="true" />
          <span className="wmp-title-text">Playlist Maker</span>
        </div>
        <div className="wmp-winctl">
          <button className="winbtn" title="Minimize" onClick={() => window.api.window.minimize()}>&#x2013;</button>
          <button className="winbtn" title="Maximize" onClick={() => window.api.window.maximize()}>❐</button>
          <button className="winbtn close" title="Close" onClick={() => window.api.window.close()}>&#x2715;</button>
        </div>
      </div>

      <div className="wmp-tabbar">
        <button className="wmp-brand" onClick={goHome}>
          <img className="wmp-brand-icon" src={logo} alt="" aria-hidden="true" />
          <span className="wmp-brand-text">Playlist Maker</span>
        </button>
        <div className="wmp-tabbar-right">
          <button className="wmp-glossy-btn small" onClick={() => setSettingsOpen(true)}>⚙ Settings</button>
          <ThemeControls />
        </div>
      </div>

      <div className="wmp-body">
        <aside className="wmp-sidebar">
          <div className="wmp-sidebar-group">
            <div className="wmp-sidebar-label">Library</div>
            <button
              className={`wmp-navitem${!selectedPlaylist ? ' active' : ''}`}
              onClick={goHome}
            >
              <span className="wmp-navicon" aria-hidden="true">▤</span>
              My Playlists
            </button>
          </div>

          {selectedPlaylist && (
            <div className="wmp-sidebar-group">
              <div className="wmp-sidebar-label">Now Playing</div>
              <div className="wmp-navitem active wmp-navitem--static">
                <span className="wmp-navicon" aria-hidden="true">▶</span>
                {selectedPlaylist.title}
              </div>
            </div>
          )}
        </aside>

        <main className="wmp-content">
          {selectedPlaylist
            ? (
              <SongPlayerPage
                playlist={selectedPlaylist}
                onBack={() => selectPlaylist(null)}
                onSelectPlaylist={selectPlaylist}
              />
            )
            : <PlaylistPage onSelectPlaylist={selectPlaylist} />
          }
        </main>
      </div>

      <div className="wmp-statusbar">
        <span>{selectedPlaylist ? `Now Playing — ${selectedPlaylist.title}` : 'My Playlists'}</span>
      </div>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      <GamepadKeyboard />
    </div>
  );
}

export default App;
