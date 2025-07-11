const pool = require('../config/db');

const marketPriceService = {
  async getMarketPricesByItemId(itemId) {
    const result = await pool.query(
      `SELECT market_price, quantity
       FROM market_data
       WHERE item = $1
       ORDER BY id DESC`,
      [itemId]
    );
    return result.rows;
  },

  async getCurrentMarketPrice(itemId) {
    const result = await pool.query(
      `SELECT market_price, quantity
       FROM market_data
       WHERE item = $1
       AND id = (SELECT MAX(id) FROM market_data WHERE item = $1)`,
      [itemId]
    );
    return result.rows[0];
  },
};

module.exports = marketPriceService;