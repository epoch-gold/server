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
      `SELECT a.entry, a.quantity, a.price, s.timestamp
       FROM auctions a
       JOIN scans s ON a.scan = s.id
       WHERE a.item = $1
       ORDER BY s.timestamp DESC`,
      [itemId]
    );
    return result.rows;
  },
};

module.exports = itemService;