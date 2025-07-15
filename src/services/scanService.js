const pool = require("../config/db");
const itemService = require("./itemService");

const scanService = {
  async processScan(scanData) {
    const { items, auctions, scanInfo } = scanData;
    const { timestamp, count } = scanInfo;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const scanDate = new Date(timestamp * 1000).toISOString().split("T")[0];
      const currentDate = new Date().toISOString().split("T")[0];

      if (scanDate !== currentDate) {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
        await this.processEndOfDayAverages(client, yesterday);
      }

      const scanResult = await client.query(
        "INSERT INTO scans (timestamp, quantity) VALUES ($1, $2) RETURNING id",
        [timestamp, count]
      );
      const scanId = scanResult.rows[0].id;

      await client.query("DELETE FROM auctions");

      for (const item of items) {
        await itemService.createItem({
          id: item.entry,
          name: item.name,
          icon: item.icon,
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
            "INSERT INTO auctions (item, index, scan, quantity, price) VALUES ($1, $2, $3, $4, $5)",
            [auction.entry, i + 1, scanId, auction.quantity, auction.price]
          );
        }
      }

      await this.updateMarketData(client, scanId);

      await client.query("COMMIT");
      return scanId;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error processing scan:", error.message);
      throw error;
    } finally {
      client.release();
    }
  },

  async updateMarketData(client, scanId) {
    const itemsResult = await client.query(
      `SELECT DISTINCT item FROM auctions WHERE scan = $1`,
      [scanId]
    );

    for (const itemRow of itemsResult.rows) {
      const itemId = itemRow.item;

      const auctionsResult = await client.query(
        `
        SELECT 
          a.price / a.quantity AS unit_price,
          a.quantity
        FROM auctions a
        WHERE a.scan = $1 AND a.item = $2
        ORDER BY a.price / a.quantity ASC
        `,
        [scanId, itemId]
      );

      if (auctionsResult.rows.length === 0) continue;

      const auctions = auctionsResult.rows;
      const totalQuantity = auctions.reduce(
        (sum, auction) => sum + auction.quantity,
        0
      );

      const lowest20PercentCount = Math.max(
        1,
        Math.ceil(auctions.length * 0.2)
      );
      const lowest20Percent = auctions.slice(0, lowest20PercentCount);

      const sortedPrices = lowest20Percent
        .map((auction) => auction.unit_price)
        .sort((a, b) => a - b);
      let marketPrice;

      if (sortedPrices.length % 2 === 0) {
        const mid1 = sortedPrices[Math.floor(sortedPrices.length / 2) - 1];
        const mid2 = sortedPrices[Math.floor(sortedPrices.length / 2)];
        marketPrice = (mid1 + mid2) / 2;
      } else {
        marketPrice = sortedPrices[Math.floor(sortedPrices.length / 2)];
      }

      await client.query(
        `INSERT INTO market_data (item, scan, market_price, quantity)
         VALUES ($1, $2, $3, $4)`,
        [itemId, scanId, Math.round(marketPrice), totalQuantity]
      );
    }
  },

  async processEndOfDayAverages(client, targetDate) {
    const avgResult = await client.query(
      `
      SELECT 
        md.item,
        AVG(md.market_price) AS avg_market_price,
        SUM(md.quantity) AS total_quantity,
        MIN(s.timestamp) AS day_timestamp
      FROM market_data md
      JOIN scans s ON md.scan = s.id
      WHERE DATE(TIMESTAMP 'epoch' + s.timestamp * INTERVAL '1 second') = $1
      GROUP BY md.item
      `,
      [targetDate]
    );

    if (avgResult.rows.length > 0) {
      const dayTimestamp = avgResult.rows[0].day_timestamp;
      const avgScanResult = await client.query(
        "INSERT INTO scans (timestamp, quantity) VALUES ($1, $2) RETURNING id",
        [dayTimestamp, 0]
      );
      const avgScanId = avgScanResult.rows[0].id;

      for (const row of avgResult.rows) {
        await client.query(
          `INSERT INTO market_data (item, scan, market_price, quantity)
           VALUES ($1, $2, $3, $4)`,
          [
            row.item,
            avgScanId,
            Math.round(row.avg_market_price),
            row.total_quantity,
          ]
        );
      }

      await client.query(
        `DELETE FROM market_data 
         WHERE scan IN (
           SELECT id FROM scans 
           WHERE DATE(TIMESTAMP 'epoch' + timestamp * INTERVAL '1 second') = $1
           AND id != $2
         )`,
        [targetDate, avgScanId]
      );

      await client.query(
        `DELETE FROM scans 
         WHERE DATE(TIMESTAMP 'epoch' + timestamp * INTERVAL '1 second') = $1
         AND id != $2`,
        [targetDate, avgScanId]
      );
    }
  },

  async processAllPendingAverages() {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const pendingDates = await client.query(
        `
        SELECT DISTINCT DATE(TIMESTAMP 'epoch' + s.timestamp * INTERVAL '1 second') as scan_date
        FROM scans s
        WHERE s.quantity > 0  -- Exclude already averaged scans (quantity = 0)
        GROUP BY DATE(TIMESTAMP 'epoch' + s.timestamp * INTERVAL '1 second')
        HAVING COUNT(*) > 1
        ORDER BY scan_date
        `
      );

      for (const row of pendingDates.rows) {
        await this.processEndOfDayAverages(client, row.scan_date);
      }

      await client.query("COMMIT");
      return pendingDates.rows.length;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error processing pending averages:", error.message);
      throw error;
    } finally {
      client.release();
    }
  },

  async runProcessAverages() {
    try {
      console.log("Processing pending day averages...");
      const processedDays = await this.processAllPendingAverages();
      console.log(`Successfully processed averages for ${processedDays} days.`);
      return processedDays;
    } catch (error) {
      console.error("Error processing averages:", error.message);
      throw error;
    }
  },
};

module.exports = scanService;
