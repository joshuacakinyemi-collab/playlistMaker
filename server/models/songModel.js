const { getPool } = require('../db/pool');

module.exports.listByPlaylist = async (playlist_id) => {
  const query = 'SELECT * FROM songs WHERE playlist_id = $1 ORDER BY song_id ASC';
  const { rows } = await getPool().query(query, [playlist_id]);
  return rows;
};

module.exports.find = async (song_id) => {
  const query = 'SELECT * FROM songs WHERE song_id = $1';
  const { rows } = await getPool().query(query, [song_id]);
  return rows[0] || null;
};

module.exports.create = async (title, author, playlist_id, youtube_id = null, thumbnail = null) => {
  const query = 'INSERT INTO songs (title, author, playlist_id, youtube_id, thumbnail) VALUES ($1, $2, $3, $4, $5) RETURNING *';
  const { rows } = await getPool().query(query, [title, author, playlist_id, youtube_id, thumbnail]);
  return rows[0];
};

module.exports.update = async (song_id, { title, author }) => {
  const query = 'UPDATE songs SET title = $1, author = $2 WHERE song_id = $3 RETURNING *';
  const { rows } = await getPool().query(query, [title, author, song_id]);
  return rows[0];
};

module.exports.destroy = async (song_id) => {
  const query = 'DELETE FROM songs WHERE song_id = $1 RETURNING *';
  const { rows } = await getPool().query(query, [song_id]);
  return rows[0] || null;
};
