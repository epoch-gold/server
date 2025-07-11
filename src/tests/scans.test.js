const request = require('supertest');
const { app } = require('../server');
const pool = require('../config/db');

describe('Scan API Endpoints', () => {
  afterEach(async () => {
    await pool.query('DELETE FROM market_data');
    await pool.query('DELETE FROM auctions');
    await pool.query('DELETE FROM scans');
    await pool.query('DELETE FROM items');
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('POST /scans', () => {
    const validScan = {
      items: [
        {
          entry: 17771,
          name: 'Elementium Bar',
          icon: 'INV_Ingot_Thorium',
          quantity: 10,
          price: 164000,
        },
      ],
      scanInfo: {
        count: 1,
        timestamp: 1752200040,
      },
    };

    test('should create a scan with valid API key', async () => {
      const response = await request(app)
        .post('/scans')
        .set('x-api-key', process.env.API_KEY)
        .send(validScan)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('scan_id');

      const item = await pool.query('SELECT * FROM items WHERE id = $1', [17771]);
      expect(item.rows[0].name).toBe('Elementium Bar');

      const scan = await pool.query('SELECT * FROM scans WHERE id = $1', [response.body.scan_id]);
      expect(scan.rows[0].timestamp).toBe(1752200040);

      const auction = await pool.query('SELECT * FROM auctions WHERE scan = $1', [response.body.scan_id]);
      expect(auction.rows[0].item).toBe(17771);
      expect(auction.rows[0].quantity).toBe(10);
      expect(auction.rows[0].price).toBe(164000);

      const marketData = await pool.query('SELECT * FROM market_data WHERE item = $1', [17771]);
      expect(marketData.rows[0].market_price).toBe(164000.0);
    });

    test('should return 401 for invalid API key', async () => {
      const response = await request(app)
        .post('/scans')
        .set('x-api-key', 'invalid-key')
        .send(validScan)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body.error).toBe('Unauthorized: Invalid API key');
    });

    test('should return 400 for invalid scan data', async () => {
      const response = await request(app)
        .post('/scans')
        .set('x-api-key', process.env.API_KEY)
        .send({})
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.error).toBe('Invalid scan data');
    });
  });
});