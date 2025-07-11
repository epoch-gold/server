const pool = require('../config/db');

const itemService = {
  async getAllItems() {
    const result = await pool.query('SELECT * FROM items ORDER BY id');
    return result.rows;
  },

  async getItemById(itemId) {
    const result = await pool.query('SELECT * FROM items WHERE id = $1', [itemId]);
    return result.rows[0];
  },

  async createItem(item) {
    const { id, name, icon } = item;
    const result = await pool.query(
      'INSERT INTO items (id, name, icon) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING RETURNING *',
      [id, name, icon]
    );
    return result.rows[0];
  },

  async getAuctionsByItemId(itemId) {
    const result = await pool.query(
      `SELECT item, quantity, price
       FROM auctions
       WHERE item = $1`,
      [itemId]
    );
    return result.rows;
  },
};

module.exports = itemService;