import { useEffect, useRef, useState } from 'react';
import GamepadKeyboard from './components/GamepadKeyboard';
import LibraryScreen from './screens/LibraryScreen';
import PlaylistScreen from './screens/PlaylistScreen';
import AddSongScreen from './screens/AddSongScreen';
import PlaylistFormScreen from './screens/PlaylistFormScreen';
import ImportScreen from './screens/ImportScreen';
import SettingsScreen from './screens/SettingsScreen';
import NowPlaying from './player/NowPlaying';
import MiniPlayer from './player/MiniPlayer';
import { usePlayer } from './player/PlayerContext';
import logo from './assets/logo.png';
import { isUsingPointer, registerGamepadActions } from './gamepad.js';

// Navigation works like an mp3 player's menus: a stack of screens, where
// opening something pushes a screen and Back pops one. Each entry is
// { screen, ...params }.
const ROOT = { screen: 'library' };

const TITLES = {
  library: 'Playlists',
  addSong: 'Add Song',
  newPlaylist: 'New Playlist',
  editPlaylist: 'Edit Playlist',
  import: 'Import Playlist',
  settings: 'Settings',
  nowPlaying: 'Now Playing',
};

function App() {
  const player = usePlayer();
  const [stack, setStack] = useState([ROOT]);
  // Which way the screen slides in: forward (push) or back (pop).
  const [direction, setDirection] = useState('forward');
  const [mp3Mode, setMp3Mode] = useState(false);
  const screenRef = useRef(null);

  const top = stack[stack.length - 1];
  const canGoBack = stack.length > 1;

  const push = (entry) => {
    setDirection('forward');
    setStack((s) => [...s, entry]);
  };

  // Each step reads the latest stack (not this render's copy), so several
  // quick Back presses — or a mashed controller button — can never pop
  // past the root screen.
  const pop = () => {
    setDirection('back');
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  };

  // Opens a screen, or jumps back to it if it's already open further down
  // the stack (so Now Playing ⇄ playlist hops don't pile up forever).
  const open = (entry) => {
    const matches = (e) => e.screen === entry.screen && e.playlist?.playlist_id === entry.playlist?.playlist_id;
    setDirection(stack.some(matches) ? 'back' : 'forward');
    setStack((s) => {
      const existing = s.findIndex(matches);
      return existing !== -1 ? s.slice(0, existing + 1) : [...s, entry];
    });
  };

  const goHome = () => {
    setDirection('back');
    setStack([ROOT]);
  };

  // A playlist was renamed: update it wherever it sits in the stack.
  const replacePlaylist = (updated) => {
    setStack((s) => s.map((e) => (e.playlist?.playlist_id === updated.playlist_id ? { ...e, playlist: updated } : e)));
    player.updatePlaylistInfo(updated);
  };

  // Shrinks the window down to a pocket player; turning it off puts the
  // window back where it was.
  const setMp3 = (enabled) => {
    setMp3Mode(enabled);
    window.api.window.setMp3Mode(enabled);
    if (enabled && player.currentSong && top.screen !== 'nowPlaying') open({ screen: 'nowPlaying' });
  };

  const openNowPlaying = () => open({ screen: 'nowPlaying' });
  const openQueue = () => player.playlist && open({ screen: 'playlist', playlist: player.playlist });

  // Move focus into each new screen so the controller's D-pad and the
  // keyboard always start from something on screen (skipped for mouse
  // users, who'd just see a stray highlight).
  useEffect(() => {
    const el = screenRef.current;
    if (!el || isUsingPointer() || el.contains(document.activeElement)) return;
    el.querySelector('[autofocus], .menu-row, button, input')?.focus({ preventScroll: true });
  }, [stack]);

  // B = back (or leave MP3 mode from its root), Start = Settings.
  useEffect(
    () =>
      registerGamepadActions({
        onBack: () => {
          if (canGoBack) pop();
          else if (mp3Mode) setMp3(false);
        },
        onStart: () => (top.screen === 'settings' ? pop() : open({ screen: 'settings' })),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stack, mp3Mode]
  );

  let content;
  switch (top.screen) {
    case 'playlist':
      content = (
        <PlaylistScreen
          playlist={top.playlist}
          onAddSong={() => push({ screen: 'addSong', playlist: top.playlist })}
          onEdit={() => push({ screen: 'editPlaylist', playlist: top.playlist })}
          onDeleted={goHome}
          onOpenNowPlaying={openNowPlaying}
        />
      );
      break;
    case 'addSong':
      content = <AddSongScreen playlist={top.playlist} onDone={pop} />;
      break;
    case 'newPlaylist':
      content = (
        <PlaylistFormScreen
          onSaved={(created) => {
            setDirection('forward');
            setStack([ROOT, { screen: 'playlist', playlist: created }]);
          }}
        />
      );
      break;
    case 'editPlaylist':
      content = (
        <PlaylistFormScreen
          playlist={top.playlist}
          onSaved={(updated) => {
            replacePlaylist(updated);
            pop();
          }}
        />
      );
      break;
    case 'import':
      content = (
        <ImportScreen
          onImported={(imported) => {
            setDirection('forward');
            setStack([ROOT, { screen: 'playlist', playlist: imported }]);
          }}
        />
      );
      break;
    case 'settings':
      content = <SettingsScreen mp3Mode={mp3Mode} onToggleMp3Mode={() => setMp3(!mp3Mode)} />;
      break;
    case 'nowPlaying':
      content = <NowPlaying onOpenQueue={openQueue} />;
      break;
    default:
      content = (
        <LibraryScreen
          onOpenPlaylist={(pl) => push({ screen: 'playlist', playlist: pl })}
          onNewPlaylist={() => push({ screen: 'newPlaylist' })}
          onImport={() => push({ screen: 'import' })}
        />
      );
  }

  const titleOf = (e) => (e.screen === 'playlist' ? e.playlist.title : TITLES[e.screen]);
  const title = titleOf(top);
  // Shown like a DOS prompt: C:\PLAYLISTS\ROAD TRIP>
  const path = `C:\\${stack.map(titleOf).join('\\')}>`;

  return (
    <div className={`app${mp3Mode ? ' mp3-mode' : ''}`}>
      <div className="titlebar">
        <div className="titlebar-title">
          <img className="titlebar-icon" src={logo} alt="" aria-hidden="true" />
          <span className="titlebar-text">Playlist Maker</span>
        </div>
        <div className="winctl">
          {mp3Mode && (
            <button className="winbtn" title="Exit MP3 player mode" onClick={() => setMp3(false)}>&#x2922;</button>
          )}
          <button className="winbtn" title="Minimize" onClick={() => window.api.window.minimize()}>&#x2013;</button>
          <button className="winbtn" title="Maximize" onClick={() => window.api.window.maximize()}>❐</button>
          <button className="winbtn close" title="Close" onClick={() => window.api.window.close()}>&#x2715;</button>
        </div>
      </div>

      <div className="device">
        <div className="screen-header">
          <button
            type="button"
            className="header-btn"
            onClick={pop}
            disabled={!canGoBack}
            aria-label="Back"
            title="Back"
          >Esc</button>
          <h1 className="screen-title" title={title}>
            <span className="screen-path"><span>{path}</span></span>
            <span className="cursor" aria-hidden="true" />
          </h1>
          <div className="header-right">
            {mp3Mode ? (
              <button type="button" className="header-btn" onClick={() => setMp3(false)} title="Back to normal mode" aria-label="Back to normal mode">Full</button>
            ) : (
              <button type="button" className="header-btn" onClick={() => setMp3(true)} title="MP3 Player Mode" aria-label="MP3 Player Mode">MP3</button>
            )}
            <button
              type="button"
              className={`header-btn${top.screen === 'settings' ? ' on' : ''}`}
              onClick={() => (top.screen === 'settings' ? pop() : open({ screen: 'settings' }))}
              title="Settings"
              aria-label="Settings"
            >Setup</button>
          </div>
        </div>

        <main
          ref={screenRef}
          key={`${stack.length}-${top.screen}-${top.playlist?.playlist_id || ''}`}
          className={`screen slide-${direction}${top.screen === 'nowPlaying' ? ' screen--now-playing' : ''}`}
        >
          {content}
        </main>

        {top.screen !== 'nowPlaying' && <MiniPlayer onOpen={openNowPlaying} />}

        <footer className="keybar" aria-hidden="true">
          <span><b>↑↓</b> Move</span>
          <span><b>Enter</b> Select</span>
          <span><b>Esc</b> Back</span>
        </footer>
      </div>

      <GamepadKeyboard />
    </div>
  );
}

export default App;
