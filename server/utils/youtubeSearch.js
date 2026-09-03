const cache = new Map();

module.exports.searchYouTube = async (title, author, maxResults = 1) => {
  const query = `${title} ${author}`;
  const cacheKey = `${query}:${maxResults}`;

  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (cached.expires > Date.now()) {
      console.log(`[Youtube cache hit] ${cacheKey}`);
      return cached.data;
    }
    cache.delete(cacheKey);
  }

  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('q', query);
  url.searchParams.set('type', 'video');
  url.searchParams.set('maxResults', String(maxResults));
  url.searchParams.set('key', process.env.YOUTUBE_API_KEY);

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`YouTube API error: ${res.status}`);
  }

  const data = await res.json();

  if (!data.items || data.items.length === 0) {
    return maxResults === 1 ? null : [];
  }

  const results = data.items.map((item) => {
    const thumbnails = item.snippet.thumbnails;
    return {
      youtube_id: item.id.videoId,
      video_title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumbnail:
        thumbnails.high?.url ||
        thumbnails.medium?.url ||
        thumbnails.default?.url ||
        null,
    };
  });

  const toCache = maxResults === 1 ? results[0] : results;
  cache.set(cacheKey, { data: toCache, expires: Date.now() + 1000 * 60 * 60 });
  return toCache;
};
