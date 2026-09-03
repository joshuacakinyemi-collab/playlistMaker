import { useState, useEffect } from 'react';
import { getMe, login, register, logout } from './adapters/auth-adapters';
import AuthPage from './components/AuthPage';
import PlaylistPage from './components/playlist/PlaylistPage';
import PublicPlaylistPage from './components/playlist/PublicPlaylistPage';
import PublicSongPage from './components/song/PublicSongPage';
import ThemeControls from './components/theme/ThemeControls';

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
  const [closeMsg, setCloseMsg] = useState(false);

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

  const handleClose = () => {
    setCloseMsg(true);
    setTimeout(() => setCloseMsg(false), 2600);
  };

  const onLibrary = !selectedPlaylist && currentPage !== 'myPlaylists';
  const onMyPlaylists = !selectedPlaylist && currentPage === 'myPlaylists';

  const renderPage = () => {

    if (selectedPlaylist) {
      return (
        <PublicSongPage
          playlist={selectedPlaylist}
          onBack={() => selectPlaylist(null)}
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

  return (
    <div className={`wmp-app${maximized ? '' : ' windowed'}${minimized ? ' minimized' : ''}`}>
      <div className="wmp-titlebar">
        <div className="wmp-title">
          <span className="wmp-title-icon" aria-hidden="true">♪</span>
          Playlist App — Windows Media Player
        </div>
        <div className="wmp-winctl">
          <button
            className="winbtn"
            title="Minimize"
            onClick={() => setMinimized((m) => !m)}
          >&#x2013;</button>
          <button
            className="winbtn"
            title={maximized ? 'Restore Down' : 'Maximize'}
            onClick={() => setMaximized((m) => !m)}
          >{maximized ? '❐' : '□'}</button>
          <button className="winbtn close" title="Close" onClick={handleClose}>&#x2715;</button>
        </div>
        {closeMsg && (
          <div className="wmp-close-toast">You can't close a webpage that easily 😉</div>
        )}
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
