const request = require('supertest');
const { app } = require('../server');
const pool = require('../config/db');

describe('Market Price Calculations', () => {
  beforeAll(async () => {
    await pool.query('INSERT INTO items (id, name, icon) VALUES ($1, $2, $3)', [
      17771,
      'Elementium Bar',
      'INV_Ingot_Thorium',
    ]);
    const scanResult = await pool.query(
      'INSERT INTO scans (timestamp, quantity) VALUES ($1, $2) RETURNING id',
      [1752200040, 2]
    );
    const scanId = scanResult.rows[0].id;
    await pool.query(
      'INSERT INTO auctions (item, scan, quantity, price) VALUES ($1, $2, $3, $4)',
      [17771, scanId, 10, 164000]
    );
    await pool.query(
      'INSERT INTO auctions (item, scan, quantity, price) VALUES ($1, $2, $3, $4)',
      [17771, scanId, 5, 200000]
    );
  });

  afterAll(async () => {
    await pool.query('DELETE FROM market_data');
    await pool.query('DELETE FROM auctions');
    await pool.query('DELETE FROM scans');
    await pool.query('DELETE FROM items');
    await pool.end();
  });

  describe('Market Price Calculation', () => {
    test('should calculate correct average market price', async () => {
      const response = await request(app)
        .get('/items/17771/market-price')
        .expect('Content-Type', /json/)
        .expect(200);

      const expectedAverage = ((164000 * 10 + 200000 * 5) / 15).toFixed(2);
      expect(response.body.current.market_price).toBe(parseFloat(expectedAverage));
      expect(response.body.current.quantity).toBe(15);
    });
  });
});