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

export const fetchAllPlaylists = async () => {
  return handleFetch('/api/playlists');
};

export const fetchPublicPlaylists = async () => {
  return handleFetch('/api/playlists/public');
};

export const createPlaylist = async (title, description) => {
  return handleFetch('/api/playlists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description }),
  });
};

export const updatePlaylist = async (playlist_id, updates) => {
  return handleFetch(`/api/playlists/${playlist_id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
};

export const updateVisibility = async (playlist_id, is_public) => {
  return handleFetch(`/api/playlists/${playlist_id}/visibility`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_public }),
  });
};

export const deletePlaylist = async (playlist_id) => {
  return handleFetch(`/api/playlists/${playlist_id}`, { method: 'DELETE' });
};
