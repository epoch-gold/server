const pool = require("../config/db");

const marketPriceService = {
  async getMarketPricesByItemId(itemId) {
    const result = await pool.query(
      `WITH latest_daily_scans AS (
         SELECT 
           md.market_price,
           md.quantity,
           s.timestamp,
           DATE(TIMESTAMP 'epoch' + s.timestamp * INTERVAL '1 second') as scan_date,
           ROW_NUMBER() OVER (
             PARTITION BY DATE(TIMESTAMP 'epoch' + s.timestamp * INTERVAL '1 second')
             ORDER BY s.timestamp DESC
           ) as rn
         FROM market_data md
         JOIN scans s ON md.scan = s.id
         WHERE md.item = $1
       )
       SELECT market_price, quantity, timestamp
       FROM latest_daily_scans
       WHERE rn = 1
       ORDER BY timestamp DESC`,
      [itemId]
    );
    return result.rows;
  },
};

module.exports = marketPriceService;
