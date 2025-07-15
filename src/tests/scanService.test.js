const scanService = require("../services/scanService");
const pool = require("../config/db");

jest.mock("../config/db");
jest.mock("../services/itemService");

describe("ScanService - Market Price Calculation", () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    pool.connect = jest.fn().mockResolvedValue(mockClient);
    jest.clearAllMocks();
  });

  describe("updateMarketData", () => {
    test("calculates median of lowest 20% for single item with multiple auctions", async () => {
      const scanId = 1;

      mockClient.query
        .mockResolvedValueOnce({
          rows: [{ item: 123 }],
        })
        .mockResolvedValueOnce({
          rows: [
            { unit_price: 1.0, quantity: 1 },
            { unit_price: 1.5, quantity: 2 },
            { unit_price: 2.0, quantity: 1 },
            { unit_price: 2.5, quantity: 1 },
            { unit_price: 3.0, quantity: 1 },
            { unit_price: 3.5, quantity: 1 },
            { unit_price: 4.0, quantity: 1 },
            { unit_price: 4.5, quantity: 1 },
            { unit_price: 5.0, quantity: 1 },
            { unit_price: 5.5, quantity: 1 },
          ],
        })
        .mockResolvedValueOnce({ rows: [] });

      await scanService.updateMarketData(mockClient, scanId);

      expect(mockClient.query).toHaveBeenCalledWith(
        "INSERT INTO market_data (item, scan, market_price, quantity)\n         VALUES ($1, $2, $3, $4)",
        [123, scanId, 1, 11]
      );
    });

    test("calculates median of lowest 20% with odd number of auctions", async () => {
      const scanId = 1;

      mockClient.query
        .mockResolvedValueOnce({
          rows: [{ item: 456 }],
        })
        .mockResolvedValueOnce({
          rows: [
            { unit_price: 10.0, quantity: 1 },
            { unit_price: 20.0, quantity: 1 },
            { unit_price: 30.0, quantity: 1 },
            { unit_price: 40.0, quantity: 1 },
            { unit_price: 50.0, quantity: 1 },
          ],
        })
        .mockResolvedValueOnce({ rows: [] });

      await scanService.updateMarketData(mockClient, scanId);

      expect(mockClient.query).toHaveBeenCalledWith(
        "INSERT INTO market_data (item, scan, market_price, quantity)\n         VALUES ($1, $2, $3, $4)",
        [456, scanId, 10.0, 5]
      );
    });

    test("handles single auction correctly", async () => {
      const scanId = 1;

      mockClient.query
        .mockResolvedValueOnce({
          rows: [{ item: 789 }],
        })
        .mockResolvedValueOnce({
          rows: [{ unit_price: 15.0, quantity: 3 }],
        })
        .mockResolvedValueOnce({ rows: [] });

      await scanService.updateMarketData(mockClient, scanId);

      expect(mockClient.query).toHaveBeenCalledWith(
        "INSERT INTO market_data (item, scan, market_price, quantity)\n         VALUES ($1, $2, $3, $4)",
        [789, scanId, 15.0, 3]
      );
    });

    test("handles item with no auctions", async () => {
      const scanId = 1;

      mockClient.query
        .mockResolvedValueOnce({
          rows: [{ item: 999 }],
        })
        .mockResolvedValueOnce({
          rows: [],
        });

      await scanService.updateMarketData(mockClient, scanId);

      expect(mockClient.query).toHaveBeenCalledTimes(2);
    });

    test("processes multiple items correctly", async () => {
      const scanId = 1;

      mockClient.query
        .mockResolvedValueOnce({
          rows: [{ item: 111 }, { item: 222 }],
        })
        .mockResolvedValueOnce({
          rows: [
            { unit_price: 5.0, quantity: 1 },
            { unit_price: 10.0, quantity: 1 },
          ],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [
            { unit_price: 100.0, quantity: 2 },
            { unit_price: 200.0, quantity: 1 },
            { unit_price: 300.0, quantity: 1 },
          ],
        })
        .mockResolvedValueOnce({ rows: [] });

      await scanService.updateMarketData(mockClient, scanId);

      expect(mockClient.query).toHaveBeenCalledTimes(5);

      expect(mockClient.query).toHaveBeenCalledWith(
        "INSERT INTO market_data (item, scan, market_price, quantity)\n         VALUES ($1, $2, $3, $4)",
        [111, scanId, 5.0, 2]
      );

      expect(mockClient.query).toHaveBeenCalledWith(
        "INSERT INTO market_data (item, scan, market_price, quantity)\n         VALUES ($1, $2, $3, $4)",
        [222, scanId, 100.0, 4]
      );
    });
  });
});
