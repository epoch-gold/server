const request = require('supertest');
const { app } = require('./setup');
const pool = require('../config/db');

describe('Items Routes', () => {
  beforeEach(async () => {
    await pool.query('DELETE FROM items');
    await pool.query('DELETE FROM scans');
    await pool.query('DELETE FROM auctions');
    await pool.query('DELETE FROM market_data');
  });

  test('GET /items returns all items', async () => {
    await pool.query(
      'INSERT INTO items (id, name, icon) VALUES ($1, $2, $3)',
      [1, 'Test Item', 'test-icon.png']
    );

    const response = await request(app).get('/items');
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      id: 1,
      name: 'Test Item',
      icon: 'test-icon.png'
    });
  });

  test('GET /items/:id/auctions returns auctions for an item', async () => {
    await pool.query(
      'INSERT INTO items (id, name, icon) VALUES ($1, $2, $3)',
      [1, 'Test Item', 'test-icon.png']
    );
    const scanResult = await pool.query(
      'INSERT INTO scans (timestamp, quantity) VALUES ($1, $2) RETURNING id',
      [Math.floor(Date.now() / 1000), 10]
    );
    const scanId = scanResult.rows[0].id;
    await pool.query(
      'INSERT INTO auctions (item, index, scan, quantity, price) VALUES ($1, $2, $3, $4, $5)',
      [1, 1, scanId, 5, 1000]
    );

    const response = await request(app).get('/items/1/auctions');
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      entry: 1,
      quantity: 5,
      price: '1000'
    });
  });

  test('GET /items/:id/data returns market price data', async () => {
    await pool.query(
      'INSERT INTO items (id, name, icon) VALUES ($1, $2, $3)',
      [1, 'Test Item', 'test-icon.png']
    );
    const scanResult = await pool.query(
      'INSERT INTO scans (timestamp, quantity) VALUES ($1, $2) RETURNING id',
      [Math.floor(Date.now() / 1000), 10]
    );
    const scanId = scanResult.rows[0].id;
    await pool.query(
      'INSERT INTO market_data (item, scan, market_price, quantity) VALUES ($1, $2, $3, $4)',
      [1, scanId, 1000.00, 5]
    );

    const response = await request(app).get('/items/1/data');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('current');
    expect(response.body.current).toMatchObject({
      market_price: '1000.00',
      quantity: 5
    });
  });

  test('GET /items/:id/auctions returns 404 for non-existent item', async () => {
    const response = await request(app).get('/items/999/auctions');
    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ error: 'No auctions found for this item' });
  });
});