const { getPool } = require('../db/pool');

module.exports.add = async (user_id, playlist_id) => {
  const query = `
    INSERT INTO favorites (user_id, playlist_id)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
    RETURNING *
  `;
  const { rows } = await getPool().query(query, [user_id, playlist_id]);
  return rows[0] || null;
};

module.exports.remove = async (user_id, playlist_id) => {
  const query = 'DELETE FROM favorites WHERE user_id = $1 AND playlist_id = $2 RETURNING *';
  const { rows } = await getPool().query(query, [user_id, playlist_id]);
  return rows[0] || null;
};

module.exports.listByUser = async (user_id) => {
  const query = `
    SELECT playlists.*, users.username AS created_by
    FROM favorites
    JOIN playlists ON favorites.playlist_id = playlists.playlist_id
    JOIN users ON playlists.user_id = users.user_id
    WHERE favorites.user_id = $1
    ORDER BY playlists.playlist_id ASC
  `;
  const { rows } = await getPool().query(query, [user_id]);
  return rows;
};

module.exports.listIdsByUser = async (user_id) => {
  const query = 'SELECT playlist_id FROM favorites WHERE user_id = $1';
  const { rows } = await getPool().query(query, [user_id]);
  return rows.map((r) => r.playlist_id);
};
