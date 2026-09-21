const CODE_VERSION = 1;

module.exports.encodePlaylist = (playlist) => {
  const payload = {
    v: CODE_VERSION,
    title: playlist.title,
    description: playlist.description,
    songs: playlist.songs.map((s) => ({
      title: s.title,
      author: s.author,
      youtube_id: s.youtube_id,
      thumbnail: s.thumbnail,
    })),
  };
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
};

module.exports.decodeCode = (code) => {
  let payload;
  try {
    payload = JSON.parse(Buffer.from(code, 'base64url').toString('utf8'));
  } catch {
    throw new Error('That share code looks invalid.');
  }
  if (!payload || payload.v !== CODE_VERSION || !payload.title || !Array.isArray(payload.songs)) {
    throw new Error('That share code looks invalid.');
  }
  return payload;
};
