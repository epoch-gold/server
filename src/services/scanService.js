const pool = require('../config/db');
const itemService = require('./itemService');

const scanService = {
  async processScan(scanData) {
    const { items, auctions, scanInfo } = scanData;
    const { timestamp, count } = scanInfo;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const scanResult = await client.query(
        'INSERT INTO scans (timestamp, quantity) VALUES ($1, $2) RETURNING id',
        [timestamp, count]
      );
      const scanId = scanResult.rows[0].id;

      for (const item of items) {
        await itemService.createItem({
          id: item.entry,
          name: item.name,
          icon: item.icon
        });
      }

      for (const auction of auctions) {
        await client.query(
          'INSERT INTO auctions (item, scan, quantity, price) VALUES ($1, $2, $3, $4)',
          [auction.entry, scanId, auction.quantity, auction.price]
        );
      }

      await this.updateMarketData(client, scanId);

      await client.query('COMMIT');
      return scanId;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async updateMarketData(client, scanId) {
    const scanResult = await client.query(
      'SELECT timestamp FROM scans WHERE id = $1',
      [scanId]
    );
    const timestamp = scanResult.rows[0].timestamp;
    const scanDate = new Date(timestamp * 1000).toISOString().split('T')[0];

    const marketDataResult = await client.query(
      `SELECT 
         a.item,
         AVG(a.price)::NUMERIC(15, 2) AS market_price,
         SUM(a.quantity) AS quantity
       FROM auctions a
       WHERE a.scan = $1
       GROUP BY a.item`,
      [scanId]
    );

    for (const row of marketDataResult.rows) {
      await client.query(
        `INSERT INTO market_data (item, market_price, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (item) DO UPDATE
         SET market_price = EXCLUDED.market_price,
             quantity = EXCLUDED.quantity`,
        [row.item, row.market_price, row.quantity]
      );
    }
  },
};

module.exports = scanService;