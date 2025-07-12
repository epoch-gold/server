const pool = require('../config/db');
const itemService = require('./itemService');

const scanService = {
  async processScan(scanData) {
    const { items, auctions, scanInfo } = scanData;
    const { timestamp, count } = scanInfo;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const scanDate = new Date(timestamp * 1000).toISOString().split('T')[0];

      const scanResult = await client.query(
        'INSERT INTO scans (timestamp, quantity) VALUES ($1, $2) RETURNING id',
        [timestamp, count]
      );
      const scanId = scanResult.rows[0].id;

      await client.query(
        `DELETE FROM market_data 
         WHERE scan IN (
           SELECT id FROM scans 
           WHERE DATE(TIMESTAMP 'epoch' + timestamp * INTERVAL '1 second') = $1
           AND id != $2
         )`,
        [scanDate, scanId]
      );

      await client.query('DELETE FROM auctions');

      await client.query(
        `DELETE FROM scans 
         WHERE id != $1 
         AND DATE(TIMESTAMP 'epoch' + timestamp * INTERVAL '1 second') = $2`,
        [scanId, scanDate]
      );

      for (const item of items) {
        await itemService.createItem({
          id: item.entry,
          name: item.name,
          icon: item.icon
        });
      }

      const auctionsByItem = auctions.reduce((acc, auction) => {
        const itemId = auction.entry;
        if (!acc[itemId]) {
          acc[itemId] = [];
        }
        acc[itemId].push(auction);
        return acc;
      }, {});

      for (const itemId in auctionsByItem) {
        const itemAuctions = auctionsByItem[itemId];
        for (let i = 0; i < itemAuctions.length; i++) {
          const auction = itemAuctions[i];
          await client.query(
            'INSERT INTO auctions (item, index, scan, quantity, price) VALUES ($1, $2, $3, $4, $5)',
            [auction.entry, i + 1, scanId, auction.quantity, auction.price]
          );
        }
      }

      await this.updateMarketData(client, scanId);

      await client.query('COMMIT');
      return scanId;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error processing scan:', error.message);
      throw error;
    } finally {
      client.release();
    }
  },

  async updateMarketData(client, scanId) {
    const marketDataResult = await client.query(
      `
     WITH stats AS (
       SELECT
         a.item,
         PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY a.price) AS q1,
         PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY a.price) AS q3
       FROM auctions a
       WHERE a.scan = $1
       GROUP BY a.item
     ),
     filtered_auctions AS (
       SELECT
         a.item,
         a.price,
         a.quantity
       FROM auctions a
       JOIN stats ON a.item = stats.item
       WHERE a.scan = $1
         AND a.price >= stats.q1 - 1.5 * (stats.q3 - stats.q1)
         AND a.price <= stats.q3 + 1.5 * (stats.q3 - stats.q1)
     )
     SELECT
       fa.item,
       (SUM(fa.price::NUMERIC * fa.quantity) / SUM(fa.quantity))::NUMERIC(15, 2) AS market_price,
       SUM(fa.quantity) AS quantity
     FROM filtered_auctions fa
     GROUP BY fa.item
     `,
      [scanId]
    );

    for (const row of marketDataResult.rows) {
      await client.query(
        `INSERT INTO market_data (item, scan, market_price, quantity)
         VALUES ($1, $2, $3, $4)`,
        [row.item, scanId, row.market_price, row.quantity]
      );
    }
  },
};

module.exports = scanService;