const request = require('supertest');
const { app } = require('./setup');
const pool = require('config/db');
const itemService = require("services/itemService");
const marketPriceService = require("services/marketPriceService");

jest.mock("services/itemService");
jest.mock("services/marketPriceService");

describe('Items Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /items returns all items', async () => {
    const mockItems = [{ id: 1, name: 'Test Item', icon: 'test-icon.png' }];
    itemService.getAllItems.mockResolvedValue(mockItems);

    const response = await request(app).get('/items');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockItems);
  });

  test('GET /items/:id/auctions returns auctions for an item', async () => {
    const mockAuctions = [{ item: 1, quantity: 5, price: '1000' }];
    itemService.getAuctionsByItemId.mockResolvedValue(mockAuctions);

    const response = await request(app).get('/items/1/auctions');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockAuctions);
  });

  test('GET /items/:id/data returns market price data', async () => {
    const mockPrices = [{ market_price: '1000.00', quantity: 5, timestamp: '1678886400' }];
    marketPriceService.getMarketPricesByItemId.mockResolvedValue(mockPrices);

    const response = await request(app).get('/items/1/data');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockPrices);
  });

  test('GET /items/:id/auctions returns 404 for non-existent item', async () => {
    itemService.getAuctionsByItemId.mockResolvedValue([]);
    const response = await request(app).get('/items/999/auctions');
    expect(response.status).toBe(404);
  });
});