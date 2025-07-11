const { app } = require('../server');
const pool = require('../config/db');

beforeAll(async () => {
  await pool.query('SELECT 1');
});

afterAll(async () => {
  await pool.end();
});

module.exports = { app };