const zlib = require('zlib');

const CODE_VERSION = 2;

// A song's thumbnail is just a predictable function of its YouTube id, so
// it's never stored in the code — the importing side regenerates it here.
const thumbnailFor = (youtube_id) =>
  youtube_id ? `https://i.ytimg.com/vi/${youtube_id}/hqdefault.jpg` : null;

module.exports.encodePlaylist = (playlist) => {
  // Short keys + array-of-arrays songs (instead of {title, author, ...}
  // objects) avoid repeating field names once per song, and dropping the
  // thumbnail avoids storing a ~50-char URL per song. gzip squeezes the
  // result further before it's base64url-encoded.
  const payload = {
    v: CODE_VERSION,
    t: playlist.title,
    d: playlist.description,
    s: playlist.songs.map((song) => [song.title, song.author, song.youtube_id]),
  };
  const compressed = zlib.gzipSync(Buffer.from(JSON.stringify(payload), 'utf8'));
  return compressed.toString('base64url');
};

module.exports.decodeCode = (code) => {
  let payload;
  try {
    const json = zlib.gunzipSync(Buffer.from(code, 'base64url')).toString('utf8');
    payload = JSON.parse(json);
  } catch {
    throw new Error('That share code looks invalid.');
  }
  if (!payload || payload.v !== CODE_VERSION || !payload.t || !Array.isArray(payload.s)) {
    throw new Error('That share code looks invalid.');
  }
  return {
    title: payload.t,
    description: payload.d,
    songs: payload.s.map(([title, author, youtube_id]) => ({
      title,
      author,
      youtube_id,
      thumbnail: thumbnailFor(youtube_id),
    })),
  };
};
