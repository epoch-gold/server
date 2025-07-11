const request = require('supertest');
const { app } = require('./setup');
const pool = require('../config/db');

describe('Scans Route', () => {
  beforeEach(async () => {
    await pool.query('DELETE FROM items');
    await pool.query('DELETE FROM scans');
    await pool.query('DELETE FROM auctions');
    await pool.query('DELETE FROM market_data');
  });

  test('POST /scans creates a new scan with valid data and API key', async () => {
    const scanData = {
      items: [{ entry: 1, name: 'Test Item', icon: 'test-icon.png' }],
      auctions: [{ entry: 1, quantity: 5, price: 1000 }],
      scanInfo: { timestamp: Math.floor(Date.now() / 1000), count: 1 }
    };

    const response = await request(app)
      .post('/scans')
      .set('x-api-key', process.env.API_KEY)
      .send(scanData);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('scan_id');
    expect(typeof response.body.scan_id).toBe('number');

    const scanResult = await pool.query('SELECT * FROM scans WHERE id = $1', [response.body.scan_id]);
    expect(scanResult.rows).toHaveLength(1);
  });

  test('POST /scans fails with invalid API key', async () => {
    const scanData = {
      items: [{ entry: 1, name: 'Test Item', icon: 'test-icon.png' }],
      auctions: [{ entry: 1, quantity: 5, price: 1000 }],
      scanInfo: { timestamp: Math.floor(Date.now() / 1000), count: 1 }
    };

    const response = await request(app)
      .post('/scans')
      .set('x-api-key', 'invalid-key')
      .send(scanData);

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ error: 'Unauthorized: Invalid API key' });
  });

  test('POST /scans fails with missing scan data', async () => {
    const scanData = {
      items: [{ entry: 1, name: 'Test Item' }],
      auctions: [{ entry: 1, quantity: 5, price: 1000 }],
      scanInfo: { timestamp: Math.floor(Date.now() / 1000), count: 1 }
    };

    const response = await request(app)
      .post('/scans')
      .set('x-api-key', process.env.API_KEY)
      .send(scanData);

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/Invalid scan data:.*missing.*icon/);
  });
});