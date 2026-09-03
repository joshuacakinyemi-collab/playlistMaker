const bcrypt = require('bcrypt');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { initPool, getPool } = require('./pool');

const SALT_ROUNDS = 7;

const seed = async () => {
  const pool = getPool();

  await pool.query('DROP TABLE IF EXISTS favorites CASCADE');
  await pool.query('DROP TABLE IF EXISTS songs CASCADE');
  await pool.query('DROP TABLE IF EXISTS playlists CASCADE');
  await pool.query('DROP TABLE IF EXISTS users CASCADE');

  await pool.query(`
    CREATE TABLE users (
      user_id       SERIAL PRIMARY KEY,
      username      TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE playlists (
      playlist_id  SERIAL PRIMARY KEY,
      title        TEXT NOT NULL,
      description  TEXT NOT NULL,
      is_public    BOOLEAN NOT NULL DEFAULT FALSE,
      user_id      INT REFERENCES users(user_id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE songs (
      song_id     SERIAL PRIMARY KEY,
      title       TEXT NOT NULL,
      author      TEXT NOT NULL,
      youtube_id  TEXT,
      thumbnail   TEXT,
      playlist_id INT REFERENCES playlists(playlist_id) ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE favorites (
      user_id     INT REFERENCES users(user_id) ON DELETE CASCADE,
      playlist_id INT REFERENCES playlists(playlist_id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, playlist_id)
    )
  `);

  const [DjRandomHash, ImNotACatHash] = await Promise.all([
    bcrypt.hash('letmein123', SALT_ROUNDS),
    bcrypt.hash('tunaTreat06', SALT_ROUNDS),
  ]);

  const { rows: users } = await pool.query(`
    INSERT INTO users (username, password_hash) VALUES
      ('DjRandom', $1),
      ('ImNotACat', $2)
    RETURNING user_id, username
  `, [DjRandomHash, ImNotACatHash]);

  const [DjRandom, ImNotACat] = users;

  const { rows: playlists } = await pool.query(`
    INSERT INTO playlists (title, description, is_public, user_id) VALUES
      ('Can''t let gang kno I fw this', 'You''ll never see this',  FALSE, $1),
      ('Random Mix',                   'Youtube autoplay be like', TRUE,  $1),
      ('Phantom Beats',                'You never hear this coming', TRUE, $2),
      ('Joker Mixtape',                'walk around day and night', FALSE, $2)
    RETURNING playlist_id
  `, [DjRandom.user_id, ImNotACat.user_id]);

  const [CLGKIFT, RM, PB, JM] = playlists;

  await pool.query(`
    INSERT INTO songs (title, author, playlist_id) VALUES
      ('Everytime We Touch',       'CASCADA',         $1),
      ('Boom, Boom, Boom, Boom!!', 'Vengaboys',       $1),
      ('I wanna kno',              '2 Mello',         $2),
      ('Cheerleader',              'OMI',             $2),
      ('Clone High',               'Abandoned Pools', $2),
      ('Life Will Change',         'Lyn Inaizumi',    $3),
      ('Take Over',                'Lyn Inaizumi',    $3),
      ('Beneath the Mask',         'Lyn Inaizumi',    $4),
      ('No More What Ifs',         'Lyn Inaizumi',    $4)
  `, [CLGKIFT.playlist_id, RM.playlist_id, PB.playlist_id, JM.playlist_id]);

  await pool.query(`
    INSERT INTO favorites (user_id, playlist_id) VALUES ($1, $2), ($3, $4)
  `, [DjRandom.user_id, PB.playlist_id, ImNotACat.user_id, RM.playlist_id]);

  return users;
};

initPool()
  .then(() => seed())
  .then((users) => {
    console.log('Database seeded successfully.');
    console.log(`  Users: ${users.map((u) => u.username).join(', ')}`);
  })
  .catch((err) => {
    console.error('Error seeding database:', err);
    process.exit(1);
  })
  .finally(() => getPool().end());
