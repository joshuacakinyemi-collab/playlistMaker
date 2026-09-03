require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { initPool, getPool } = require('./pool');

const migrate = async () => {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      user_id       SERIAL PRIMARY KEY,
      username      TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS playlists (
      playlist_id  SERIAL PRIMARY KEY,
      title        TEXT NOT NULL,
      description  TEXT NOT NULL,
      is_public    BOOLEAN NOT NULL DEFAULT FALSE,
      user_id      INT REFERENCES users(user_id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS songs (
      song_id     SERIAL PRIMARY KEY,
      title       TEXT NOT NULL,
      author      TEXT NOT NULL,
      youtube_id  TEXT,
      thumbnail   TEXT,
      playlist_id INT REFERENCES playlists(playlist_id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    ALTER TABLE songs
      ADD COLUMN IF NOT EXISTS youtube_id TEXT,
      ADD COLUMN IF NOT EXISTS thumbnail  TEXT
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS favorites (
      user_id     INT REFERENCES users(user_id) ON DELETE CASCADE,
      playlist_id INT REFERENCES playlists(playlist_id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, playlist_id)
    )
  `);

  console.log('Migration complete: all tables ready.');
};

initPool()
  .then(() => migrate())
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(() => getPool().end());
