const pool = require('../config/db');

const marketPriceService = {
  async getMarketPricesByItemId(itemId) {
    const result = await pool.query(
      `SELECT
         md.market_price,
         md.quantity,
         s.timestamp
       FROM market_data md
       JOIN scans s ON md.scan = s.id
       WHERE md.item = $1
       ORDER BY s.timestamp DESC`,
      [itemId]
    );
    return result.rows;
  },
};

module.exports = marketPriceService;