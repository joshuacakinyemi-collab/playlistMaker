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

export const fetchFavorites = async () => {
  return handleFetch('/api/favorites');
};

export const fetchFavoriteIds = async () => {
  return handleFetch('/api/favorites/ids');
};

export const addFavorite = async (playlist_id) => {
  return handleFetch(`/api/favorites/${playlist_id}`, { method: 'POST' });
};

export const removeFavorite = async (playlist_id) => {
  return handleFetch(`/api/favorites/${playlist_id}`, { method: 'DELETE' });
};
