const request = require('supertest');
const { app } = require('../server');
const pool = require('../config/db');

const testTimestamp = 1752200040;

describe('Item API Endpoints', () => {
  beforeAll(async () => {
    await pool.query('INSERT INTO items (id, name, icon) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [
      17771,
      'Elementium Bar',
      'INV_Ingot_Thorium',
    ]);
    const scanResult = await pool.query(
      'INSERT INTO scans (timestamp, quantity) VALUES ($1, $2) RETURNING id',
      [testTimestamp, 15738]
    );
    const scanId = scanResult.rows[0].id;
    await pool.query(
      'INSERT INTO auctions (item, scan, quantity, price) VALUES ($1, $2, $3, $4)',
      [17771, scanId, 10, 164000]
    );
    await pool.query(
      `INSERT INTO market_data (item, market_price, quantity)
       VALUES ($1, $2, $3)`,
      [17771, 164000.00, 10]
    );
  });

  afterAll(async () => {
    await pool.query('DELETE FROM market_data');
    await pool.query('DELETE FROM auctions');
    await pool.query('DELETE FROM scans');
    await pool.query('DELETE FROM items');
    await pool.end();
  });

  describe('GET /items', () => {
    test('should return all items', async () => {
      const response = await request(app)
        .get('/items')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.some((item) => item.id === 17771)).toBe(true);
    });
  });

  describe('GET /items/:id/auctions', () => {
    test('should return auctions for an item', async () => {
      const response = await request(app)
        .get('/items/17771/auctions')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body[0]).toHaveProperty('entry');
      expect(response.body[0].item).toBe(17771);
      expect(response.body[0].quantity).toBe(10);
      expect(response.body[0].price).toBe(164000);
    });

    test('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .get('/items/99999/auctions')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.error).toBe('No auctions found for this item');
    });
  });

  describe('GET /items/:id/market-price', () => {
    test('should return current market price', async () => {
      const response = await request(app)
        .get('/items/17771/market-price')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('current');
      expect(response.body.current.item).toBe(17771);
      expect(response.body.current.market_price).toBe(164000.0);
      expect(response.body.current.quantity).toBe(10);
    });

    test('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .get('/items/99999/market-price')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.error).toBe('No market price data found for this item');
    });
  });
});