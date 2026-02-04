require('dotenv').config();
const knex = require('knex');

const connectionString = process.env.DATABASE_URL || 'sqlite:./data/app.db';

const db = knex({
  client: connectionString.startsWith('sqlite') ? 'sqlite3' : 'pg',
  connection: connectionString,
  useNullAsDefault: true,
  pool: { min: 0, max: 10 }
});

module.exports = db;
