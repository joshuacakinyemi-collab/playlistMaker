const bcrypt = require('bcrypt');
const { getPool } = require('../db/pool');

const SALT_ROUNDS = 7;

module.exports.create = async (username, password) => {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const query = 'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING user_id, username';
  const { rows } = await getPool().query(query, [username, passwordHash]);
  return rows[0];
};

module.exports.find = async (user_id) => {
  const query = 'SELECT user_id, username FROM users WHERE user_id = $1';
  const { rows } = await getPool().query(query, [user_id]);
  return rows[0] || null;
};

module.exports.findByUsername = async (username) => {
  const query = 'SELECT user_id, username FROM users WHERE username = $1';
  const { rows } = await getPool().query(query, [username]);
  return rows[0] || null;
};

module.exports.validatePassword = async (username, password) => {
  const query = 'SELECT * FROM users WHERE username = $1';
  const { rows } = await getPool().query(query, [username]);
  const user = rows[0];
  if (!user) return null;
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) return null;
  return { user_id: user.user_id, username: user.username };
};
