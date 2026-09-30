const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel, payload) => ipcRenderer.invoke(channel, payload);

contextBridge.exposeInMainWorld('api', {
  playlists: {
    list: () => invoke('playlists:list'),
    create: (title, description) => invoke('playlists:create', { title, description }),
    update: (playlist_id, updates) => invoke('playlists:update', { playlist_id, updates }),
    delete: (playlist_id) => invoke('playlists:delete', { playlist_id }),
    export: (playlist_id) => invoke('playlists:export', { playlist_id }),
    import: (code) => invoke('playlists:import', { code }),
  },
  songs: {
    list: (playlist_id) => invoke('songs:list', { playlist_id }),
    create: (playlist_id, title, author, youtube_id, thumbnail) =>
      invoke('songs:create', { playlist_id, title, author, youtube_id, thumbnail }),
    update: (song_id, updates) => invoke('songs:update', { song_id, updates }),
    delete: (song_id) => invoke('songs:delete', { song_id }),
    resolveYoutube: (song_id) => invoke('songs:resolveYoutube', { song_id }),
  },
  youtube: {
    search: (title, author) => invoke('youtube:search', { title, author }),
  },
  settings: {
    get: () => invoke('settings:get'),
    getSync: () => ipcRenderer.sendSync('settings:getSync'),
    set: (updates) => invoke('settings:set', updates),
  },
  window: {
    minimize: () => invoke('window:minimize'),
    maximize: () => invoke('window:maximize'),
    close: () => invoke('window:close'),
    setMp3Mode: (enabled) => invoke('window:setMp3Mode', enabled),
  },
});
