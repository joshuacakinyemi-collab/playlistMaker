const call = async (fn) => {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const fetchAllPlaylists = async () => {
  return call(() => window.api.playlists.list());
};

export const createPlaylist = async (title, description) => {
  return call(() => window.api.playlists.create(title, description));
};

export const updatePlaylist = async (playlist_id, updates) => {
  return call(() => window.api.playlists.update(playlist_id, updates));
};

export const deletePlaylist = async (playlist_id) => {
  return call(() => window.api.playlists.delete(playlist_id));
};

export const exportPlaylist = async (playlist_id) => {
  return call(() => window.api.playlists.export(playlist_id));
};

export const importPlaylist = async (code) => {
  return call(() => window.api.playlists.import(code));
};
