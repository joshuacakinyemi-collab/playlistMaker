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
  const [mp3Mode, setMp3Mode] = useState(false);

  // Shrinks the window down to just the player, like a handheld mp3
  // player; turning it off puts the window back where it was.
  const toggleMp3Mode = (enabled = !mp3Mode) => {
    setMp3Mode(enabled);
    window.api.window.setMp3Mode(enabled);
  };

  const selectPlaylist = (playlist) => {
    if (playlist) {
      sessionStorage.setItem('selectedPlaylist', JSON.stringify(playlist));
    } else {
      sessionStorage.removeItem('selectedPlaylist');
    }
    setSelectedPlaylist(playlist);
  };

  const goHome = () => {
    if (mp3Mode) toggleMp3Mode(false);
    selectPlaylist(null);
  };

  // B button: close Settings if it's open, else back out of the player to
  // the library. Start button: toggle Settings. Re-registered whenever
  // this state changes so the handlers never act on stale values.
  useEffect(() => {
    return registerGamepadActions({
      onBack: () => {
        if (settingsOpen) setSettingsOpen(false);
        else if (mp3Mode) toggleMp3Mode(false);
        else if (selectedPlaylist) selectPlaylist(null);
      },
      onStart: () => setSettingsOpen((open) => !open),
    });
  }, [settingsOpen, selectedPlaylist, mp3Mode]);

  return (
    <div className={`wmp-app${mp3Mode ? ' mp3-mode' : ''}`}>
      <div className="wmp-titlebar">
        <div className="wmp-title">
          <img className="wmp-title-icon" src={logo} alt="" aria-hidden="true" />
          <span className="wmp-title-text">Playlist Maker</span>
        </div>
        <div className="wmp-winctl">
          {mp3Mode && (
            <button className="winbtn mp3-exit" title="Exit MP3 player mode" onClick={() => toggleMp3Mode(false)}>&#x2922;</button>
          )}
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
                onBack={goHome}
                onSelectPlaylist={selectPlaylist}
                onEnterMp3Mode={() => toggleMp3Mode(true)}
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
