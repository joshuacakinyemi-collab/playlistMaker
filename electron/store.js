const crypto = require('crypto');
const Store = require('electron-store');

const store = new Store({
  defaults: {
    settings: { youtubeApiKey: '' },
    playlists: [],
  },
});

const getPlaylists = () => store.get('playlists');
const setPlaylists = (playlists) => store.set('playlists', playlists);

const findPlaylist = (playlist_id) =>
  getPlaylists().find((p) => p.playlist_id === playlist_id) || null;

const findSong = (song_id) => {
  for (const playlist of getPlaylists()) {
    const song = playlist.songs.find((s) => s.song_id === song_id);
    if (song) return { playlist, song };
  }
  return null;
};

module.exports.listPlaylists = () => getPlaylists();

module.exports.createPlaylist = (title, description) => {
  const playlist = {
    playlist_id: crypto.randomUUID(),
    title,
    description,
    songs: [],
  };
  setPlaylists([...getPlaylists(), playlist]);
  return playlist;
};

module.exports.updatePlaylist = (playlist_id, { title, description }) => {
  const playlists = getPlaylists();
  const playlist = playlists.find((p) => p.playlist_id === playlist_id);
  if (!playlist) return null;
  playlist.title = title;
  playlist.description = description;
  setPlaylists(playlists);
  return playlist;
};

module.exports.deletePlaylist = (playlist_id) => {
  const playlists = getPlaylists();
  const playlist = playlists.find((p) => p.playlist_id === playlist_id);
  if (!playlist) return null;
  setPlaylists(playlists.filter((p) => p.playlist_id !== playlist_id));
  return playlist;
};

module.exports.addPlaylist = (playlistData) => {
  const playlist = {
    playlist_id: crypto.randomUUID(),
    title: playlistData.title,
    description: playlistData.description || '',
    songs: (playlistData.songs || []).map((s) => ({
      song_id: crypto.randomUUID(),
      title: s.title,
      author: s.author,
      youtube_id: s.youtube_id || null,
      thumbnail: s.thumbnail || null,
    })),
  };
  setPlaylists([...getPlaylists(), playlist]);
  return playlist;
};

module.exports.listSongs = (playlist_id) => {
  const playlist = findPlaylist(playlist_id);
  return playlist ? playlist.songs : [];
};

module.exports.findSong = (song_id) => findSong(song_id)?.song || null;

module.exports.createSong = (playlist_id, title, author, youtube_id = null, thumbnail = null) => {
  const playlists = getPlaylists();
  const playlist = playlists.find((p) => p.playlist_id === playlist_id);
  if (!playlist) return null;
  const song = { song_id: crypto.randomUUID(), title, author, youtube_id, thumbnail };
  playlist.songs.push(song);
  setPlaylists(playlists);
  return song;
};

module.exports.updateSong = (song_id, updates) => {
  const playlists = getPlaylists();
  for (const playlist of playlists) {
    const song = playlist.songs.find((s) => s.song_id === song_id);
    if (song) {
      Object.assign(song, updates);
      setPlaylists(playlists);
      return song;
    }
  }
  return null;
};

module.exports.deleteSong = (song_id) => {
  const playlists = getPlaylists();
  for (const playlist of playlists) {
    const idx = playlist.songs.findIndex((s) => s.song_id === song_id);
    if (idx !== -1) {
      const [deleted] = playlist.songs.splice(idx, 1);
      setPlaylists(playlists);
      return deleted;
    }
  }
  return null;
};

module.exports.getSettings = () => store.get('settings');

module.exports.setSettings = (updates) => {
  const settings = { ...store.get('settings'), ...updates };
  store.set('settings', settings);
  return settings;
};
