import { useState, useEffect, useRef } from 'react';
import { getMe, login, register, logout } from './adapters/auth-adapters';
import AuthPage from './components/AuthPage';
import PlaylistPage from './components/playlist/PlaylistPage';
import PublicPlaylistPage from './components/playlist/PublicPlaylistPage';
import PublicSongPage from './components/song/PublicSongPage';
import ThemeControls from './components/theme/ThemeControls';

const MIN_APP_WIDTH = 360;
const MIN_APP_HEIGHT = 420;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const RESIZE_EDGES = [
  { dir: 'n', edges: { top: true } },
  { dir: 's', edges: { bottom: true } },
  { dir: 'e', edges: { right: true } },
  { dir: 'w', edges: { left: true } },
  { dir: 'ne', edges: { top: true, right: true } },
  { dir: 'nw', edges: { top: true, left: true } },
  { dir: 'se', edges: { bottom: true, right: true } },
  { dir: 'sw', edges: { bottom: true, left: true } },
];

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  const [currentPage, setCurrentPage] = useState(
    () => sessionStorage.getItem('currentPage') || 'home'
  );

  const [selectedPlaylist, setSelectedPlaylist] = useState(
    () => {
      const saved = sessionStorage.getItem('selectedPlaylist');
      return saved ? JSON.parse(saved) : null; // fix: restore selected playlist
    }
  );

  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(true);
  const [appClosed, setAppClosed] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);

  const appRef = useRef(null);
  const interactionRef = useRef(null);

  // Drops the window back to its default centered/preset sizing —
  // used by the minimize/maximize buttons to undo any manual drag.
  const resetWindowGeometry = () => {
    const el = appRef.current;
    if (!el) return;
    el.style.width = '';
    el.style.height = '';
    el.style.left = '';
    el.style.top = '';
    el.style.transform = '';
  };

  // Shared by the titlebar (move, edges === null) and the 8 resize
  // handles (edges names which sides move). Pins the window's current
  // rendered box to explicit px values so the drag math below is stable.
  const beginInteraction = (e, edges) => {
    if (e.button !== undefined && e.button !== 0) return;
    const el = appRef.current;
    if (!el) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const rect = el.getBoundingClientRect();
    el.style.transform = 'none';
    el.style.left = `${rect.left}px`;
    el.style.top = `${rect.top}px`;
    el.style.width = `${rect.width}px`;
    el.style.height = `${rect.height}px`;
    interactionRef.current = {
      edges,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: rect.left,
      startTop: rect.top,
      startWidth: rect.width,
      startHeight: rect.height,
      // A drag can't resize the browser itself, so the viewport is
      // constant for the whole gesture — read it once here instead of
      // on every pointermove.
      viewportW: window.innerWidth,
      viewportH: window.innerHeight,
    };
    setIsInteracting(true);
  };

  const handleInteractionMove = (e) => {
    const start = interactionRef.current;
    const el = appRef.current;
    if (!start || !el) return;
    const dx = e.clientX - start.startX;
    const dy = e.clientY - start.startY;
    const { viewportW, viewportH } = start;

    if (!start.edges) {
      // Moving — keep at least a sliver of the titlebar reachable so the
      // window can never get dragged somewhere it can't be grabbed back from.
      const newLeft = clamp(start.startLeft + dx, -(start.startWidth - 120), viewportW - 120);
      const newTop = clamp(start.startTop + dy, 0, viewportH - 40);
      el.style.left = `${newLeft}px`;
      el.style.top = `${newTop}px`;
      return;
    }

    let { startLeft: left, startTop: top, startWidth: width, startHeight: height } = start;

    if (start.edges.right) {
      width = clamp(start.startWidth + dx, MIN_APP_WIDTH, viewportW - start.startLeft - 4);
    }
    if (start.edges.bottom) {
      height = clamp(start.startHeight + dy, MIN_APP_HEIGHT, viewportH - start.startTop - 4);
    }
    if (start.edges.left) {
      const clampedDx = clamp(dx, -start.startLeft, start.startWidth - MIN_APP_WIDTH);
      left = start.startLeft + clampedDx;
      width = start.startWidth - clampedDx;
    }
    if (start.edges.top) {
      const clampedDy = clamp(dy, -start.startTop, start.startHeight - MIN_APP_HEIGHT);
      top = start.startTop + clampedDy;
      height = start.startHeight - clampedDy;
    }

    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    el.style.width = `${width}px`;
    el.style.height = `${height}px`;
  };

  const endInteraction = (e) => {
    interactionRef.current = null;
    setIsInteracting(false);
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleTitlebarPointerDown = (e) => {
    if (e.target.closest('.winbtn')) return;
    beginInteraction(e, null);
  };

  const setPage = (page) => {
    sessionStorage.setItem('currentPage', page);
    setCurrentPage(page);
  };

  const selectPlaylist = (playlist) => {
    if (playlist) {
      sessionStorage.setItem('selectedPlaylist', JSON.stringify(playlist)); // fix: persist
    } else {
      sessionStorage.removeItem('selectedPlaylist');
    }
    setSelectedPlaylist(playlist);
  };

  useEffect(() => {
    const checkForSession = async () => {
      const { data: user } = await getMe();
      if (user) {
        setCurrentUser(user);
        // only navigate to myPlaylists if they weren't already on a specific page
        if (sessionStorage.getItem('currentPage') !== 'home') {
          setPage('myPlaylists');
        }
      } else {
        // if no session, make sure we're not stuck on myPlaylists
        if (sessionStorage.getItem('currentPage') === 'myPlaylists') {
          setPage('home');
        }
      }
    };
    checkForSession();
  }, []);


  const handleLogin = async (username, password) => {
    const { data: user, error } = await login(username, password);
    if (error) return error;
    setCurrentUser(user);
    setPage('myPlaylists');
  };

  const handleRegister = async (username, password) => {
    const { data: user, error } = await register(username, password);
    if (error) return error;
    setCurrentUser(user);
    setPage('myPlaylists');
  };

  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
    selectPlaylist(null);
    setPage('home');
  };

  const goHome = () => {
    selectPlaylist(null);
    setPage('home');
  };

  const handleClose = () => setAppClosed(true);
  const handleReopen = () => setAppClosed(false);

  const onLibrary = !selectedPlaylist && currentPage !== 'myPlaylists';
  const onMyPlaylists = !selectedPlaylist && currentPage === 'myPlaylists';

  const renderPage = () => {

    if (selectedPlaylist) {
      return (
        <PublicSongPage
          playlist={selectedPlaylist}
          onBack={() => selectPlaylist(null)}
          onSelectPlaylist={selectPlaylist}
        />
      );
    }


    if (currentPage === 'myPlaylists' && currentUser) {
      return (
        <PlaylistPage
          currentUser={currentUser}
          handleLogout={handleLogout}
          onSelectPlaylist={selectPlaylist}
        />
      );
    }


    return (
      <div className={`home-view${!currentUser ? ' home-view--split' : ''}`}>
        <div className="browse-col">
          <PublicPlaylistPage setSelectedPlaylist={selectPlaylist} currentUser={currentUser} />
        </div>
        {!currentUser && (
          <div className="auth-col">
            <AuthPage handleLogin={handleLogin} handleRegister={handleRegister} />
          </div>
        )}
      </div>
    );
  };

  if (appClosed) {
    return (
      <div className="wmp-closed">
        <div className="wmp-closed-card">
          <div className="wmp-closed-icon" aria-hidden="true">♫</div>
          <p>Playlist App is closed.</p>
          <button className="wmp-glossy-btn" onClick={handleReopen}>
            Reopen Playlist App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={appRef}
      className={`wmp-app${maximized ? '' : ' windowed'}${minimized ? ' minimized' : ''}${isInteracting ? ' interacting' : ''}`}
    >
      {!minimized && RESIZE_EDGES.map(({ dir, edges }) => (
        <span
          key={dir}
          className={`wmp-resize-edge ${dir}`}
          onPointerDown={(e) => beginInteraction(e, edges)}
          onPointerMove={handleInteractionMove}
          onPointerUp={endInteraction}
          onPointerCancel={endInteraction}
        />
      ))}

      <div
        className="wmp-titlebar"
        onPointerDown={handleTitlebarPointerDown}
        onPointerMove={handleInteractionMove}
        onPointerUp={endInteraction}
        onPointerCancel={endInteraction}
      >
        <div className="wmp-title">
          <span className="wmp-title-icon" aria-hidden="true">♪</span>
          <span className="wmp-title-text">Playlist App — Windows Media Player</span>
        </div>
        <div className="wmp-winctl">
          <button
            className="winbtn"
            title="Minimize"
            onClick={() => { resetWindowGeometry(); setMinimized((m) => !m); }}
          >&#x2013;</button>
          <button
            className="winbtn"
            title={maximized ? 'Restore Down' : 'Maximize'}
            onClick={() => { resetWindowGeometry(); setMaximized((m) => !m); }}
          >{maximized ? '❐' : '□'}</button>
          <button className="winbtn close" title="Close" onClick={handleClose}>&#x2715;</button>
        </div>
      </div>

      <div className="wmp-tabbar">
        <button className="wmp-brand" onClick={goHome}>
          <span aria-hidden="true">♫</span> Playlist App
        </button>
        <div className="wmp-tabbar-right">
          {currentUser && (
            <div className="user-badge">
              <i className="ti ti-user" style={{ fontSize: '13px' }} aria-hidden="true" />
              {currentUser.username}
            </div>
          )}
          {currentUser && (
            <button className="wmp-glossy-btn small" onClick={handleLogout}>Log Out</button>
          )}
          <ThemeControls />
        </div>
      </div>

      <div className="wmp-body">
        <aside className="wmp-sidebar">
          <div className="wmp-sidebar-group">
            <div className="wmp-sidebar-label">Library</div>
            <button
              className={`wmp-navitem${onLibrary ? ' active' : ''}`}
              onClick={goHome}
            >
              <span className="wmp-navicon" aria-hidden="true">♫</span>
              Public Playlists
            </button>
            {currentUser && (
              <button
                className={`wmp-navitem${onMyPlaylists ? ' active' : ''}`}
                onClick={() => setPage('myPlaylists')}
              >
                <span className="wmp-navicon" aria-hidden="true">▤</span>
                My Playlists
              </button>
            )}
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

          {!currentUser && (
            <div className="wmp-sidebar-group">
              <div className="wmp-sidebar-label">Account</div>
              <p className="wmp-sidebar-hint">Log in to build your own playlists.</p>
            </div>
          )}
        </aside>

        <main className="wmp-content">
          {renderPage()}
        </main>
      </div>

      <div className="wmp-statusbar">
        <span>{currentUser ? `Signed in as ${currentUser.username}` : 'Not signed in'}</span>
        <span className="wmp-resize-grip" aria-hidden="true" />
      </div>
    </div>
  );
}

export default App;
