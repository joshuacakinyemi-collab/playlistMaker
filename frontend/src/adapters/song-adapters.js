const call = async (fn) => {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const fetchAllSongs = async (playlist_id) => {
  return call(() => window.api.songs.list(playlist_id));
};

export const createSong = async (playlist_id, title, author, youtube_id = null, thumbnail = null) => {
  return call(() => window.api.songs.create(playlist_id, title, author, youtube_id, thumbnail));
};

export const searchYouTubeForSong = async (title, author) => {
  return call(() => window.api.youtube.search(title, author));
};

export const updateSong = async (song_id, updates) => {
  return call(() => window.api.songs.update(song_id, updates));
};

export const deleteSong = async (song_id) => {
  return call(() => window.api.songs.delete(song_id));
};

export const resolveSongYoutube = async (song_id) => {
  return call(() => window.api.songs.resolveYoutube(song_id));
};
