const { createPool } = require('mysql2/promise');

const pool = createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'teraskopi54',
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
});

module.exports = pool;
