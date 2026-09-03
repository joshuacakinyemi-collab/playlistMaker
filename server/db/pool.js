require('dotenv').config();
const { Pool } = require('pg');
const { createTunnel } = require('tunnel-ssh');

let _pool = null;

const initPool = async () => {
  if (_pool) return _pool;

  if (process.env.SSH_HOST) {
    await createTunnel(
      { autoClose: false },
      { port: 5433 },
      {
        host: process.env.SSH_HOST,
        port: 22,
        username: process.env.SSH_USER,
        privateKey: process.env.SSH_PRIVATE_KEY.startsWith('-----')
          ? process.env.SSH_PRIVATE_KEY
          : Buffer.from(process.env.SSH_PRIVATE_KEY, 'base64').toString('utf8'),
      },
      {
        srcAddr: '127.0.0.1',
        srcPort: 5433,
        dstAddr: '127.0.0.1',
        dstPort: 5432,
      }
    );

    _pool = new Pool({
      host: '127.0.0.1',
      port: 5433,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
    });

    console.log('DB connected via SSH tunnel');
  } else if (process.env.PG_CONNECTION_STRING) {
    _pool = new Pool({ connectionString: process.env.PG_CONNECTION_STRING });
    console.log('DB connected via connection string');
  } else {
    _pool = new Pool();
    console.log('DB connected via PG* env vars');
  }

  return _pool;
};

const getPool = () => {
  if (!_pool) throw new Error('DB pool not initialized — call initPool() first.');
  return _pool;
};

module.exports = { initPool, getPool };
