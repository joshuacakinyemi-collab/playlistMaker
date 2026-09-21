const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');

const store = require('./store');
const { searchYouTube } = require('./youtube');
const { encodePlaylist, decodeCode } = require('./share');

const MIN_APP_WIDTH = 360;
const MIN_APP_HEIGHT = 420;

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 640,
    minWidth: MIN_APP_WIDTH,
    minHeight: MIN_APP_HEIGHT,
    frame: false,
    resizable: true,
    backgroundColor: '#1b1b1b',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const startUrl = process.env.ELECTRON_START_URL
    || `file://${path.join(__dirname, '../frontend/dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ====================================
// IPC: window controls
// ====================================

ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.handle('window:close', () => mainWindow?.close());

// ====================================
// IPC: playlists
// ====================================

ipcMain.handle('playlists:list', () => store.listPlaylists());

ipcMain.handle('playlists:create', (event, { title, description }) => {
  if (!title || !description) throw new Error('Title and description are required.');
  return store.createPlaylist(title, description);
});

ipcMain.handle('playlists:update', (event, { playlist_id, updates }) => {
  const playlist = store.updatePlaylist(playlist_id, updates);
  if (!playlist) throw new Error('Playlist not found.');
  return playlist;
});

ipcMain.handle('playlists:delete', (event, { playlist_id }) => {
  const playlist = store.deletePlaylist(playlist_id);
  if (!playlist) throw new Error('Playlist not found.');
  return playlist;
});

ipcMain.handle('playlists:export', (event, { playlist_id }) => {
  const playlist = store.listPlaylists().find((p) => p.playlist_id === playlist_id);
  if (!playlist) throw new Error('Playlist not found.');
  return encodePlaylist(playlist);
});

ipcMain.handle('playlists:import', (event, { code }) => {
  const payload = decodeCode(code);
  return store.addPlaylist(payload);
});

// ====================================
// IPC: songs
// ====================================

ipcMain.handle('songs:list', (event, { playlist_id }) => store.listSongs(playlist_id));

ipcMain.handle('songs:create', (event, { playlist_id, title, author, youtube_id, thumbnail }) => {
  if (!title || !author) throw new Error('Title and author are required.');
  const song = store.createSong(playlist_id, title, author, youtube_id || null, thumbnail || null);
  if (!song) throw new Error('Playlist not found.');
  return song;
});

ipcMain.handle('songs:update', (event, { song_id, updates }) => {
  const song = store.updateSong(song_id, updates);
  if (!song) throw new Error('Song not found.');
  return song;
});

ipcMain.handle('songs:delete', (event, { song_id }) => {
  const song = store.deleteSong(song_id);
  if (!song) throw new Error('Song not found.');
  return song;
});

ipcMain.handle('songs:resolveYoutube', async (event, { song_id }) => {
  const song = store.findSong(song_id);
  if (!song) throw new Error('Song not found.');

  if (song.youtube_id) {
    return { youtube_id: song.youtube_id, thumbnail: song.thumbnail };
  }

  const result = await searchYouTube(song.title, song.author);
  if (!result) throw new Error('No YouTube result found.');

  store.updateSong(song_id, { youtube_id: result.youtube_id, thumbnail: result.thumbnail });
  return result;
});

// ====================================
// IPC: youtube search (add-song flow)
// ====================================

ipcMain.handle('youtube:search', async (event, { title, author }) => {
  if (!title || !author) throw new Error('title and author are required');
  return searchYouTube(title, author, 5);
});

// ====================================
// IPC: settings
// ====================================

ipcMain.handle('settings:get', () => store.getSettings());
ipcMain.handle('settings:set', (event, updates) => store.setSettings(updates));
