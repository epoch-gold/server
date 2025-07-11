const request = require('supertest');
const { app } = require('./setup');
const pool = require('config/db');
const scanService = require('services/scanService');

jest.mock('services/scanService');

describe('Scans Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /scans creates a new scan with valid data and API key', async () => {
    scanService.processScan.mockResolvedValue(1);
    const scanData = {
      items: [{ entry: 1, name: 'Test Item', icon: 'test-icon.png' }],
      auctions: [{ entry: 1, quantity: 5, price: 1000 }],
      scanInfo: { timestamp: Math.floor(Date.now() / 1000), count: 1 }
    };

    const response = await request(app)
      .post('/scans')
      .set('x-api-key', 'test-api-key')
      .send(scanData);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ scan_id: 1 });
  });

  test('POST /scans fails with invalid API key', async () => {
    const response = await request(app)
      .post('/scans')
      .set('x-api-key', 'invalid-key')
      .send({});

    expect(response.status).toBe(401);
  });

  test('POST /scans fails with missing item icon', async () => {
    const scanData = {
      items: [{ entry: 1, name: 'Test Item' }],
      auctions: [{ entry: 1, quantity: 5, price: 1000 }],
      scanInfo: { timestamp: Math.floor(Date.now() / 1000), count: 1 }
    };

    const response = await request(app)
      .post('/scans')
      .set('x-api-key', 'test-api-key')
      .send(scanData);

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('missing entry, name, or icon');
  });
});