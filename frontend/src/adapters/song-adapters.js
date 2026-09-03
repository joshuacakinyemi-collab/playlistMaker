const handleFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`Fetch failed. ${response.status} ${response.statusText}`);
    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const fetchAllSongs = async (playlist_id) => {
  return handleFetch(`/api/playlists/${playlist_id}/songs`);
};

export const createSong = async (playlist_id, title, author, youtube_id = null, thumbnail = null) => {
  return handleFetch(`/api/playlists/${playlist_id}/songs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, author, youtube_id, thumbnail }),
  });
};

export const searchYouTubeForSong = async (title, author) => {
  return handleFetch(
    `/api/youtube/search?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}`
  );
};

export const updateSong = async (song_id, updates) => {
  return handleFetch(`/api/songs/${song_id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
};

export const deleteSong = async (song_id) => {
  return handleFetch(`/api/songs/${song_id}`, { method: 'DELETE' });
};
