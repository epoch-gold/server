process.env.DB_USERNAME = 'testuser';
process.env.DB_PASSWORD = 'testpassword';
process.env.DB_NAME = 'testdb';
process.env.API_KEY = 'test-api-key';
process.env.NODE_ENV = 'test';


const { app } = require('../server');
const pool = require('../config/db');

beforeAll(async () => {
  await new Promise(res => setTimeout(res, 1000));
});

afterAll(async () => {
  await pool.end();
});

module.exports = { app };