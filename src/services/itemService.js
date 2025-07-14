const pool = require("../config/db");

const itemService = {
  async getAllItems(page = 1, limit = 50, search = "") {
    const offset = (page - 1) * limit;

    let query = "SELECT * FROM items";
    let countQuery = "SELECT COUNT(*) FROM items";
    const params = [];

    if (search) {
      query += " WHERE name ILIKE $1";
      countQuery += " WHERE name ILIKE $1";
      params.push(`%${search}%`);
    }

    query +=
      " ORDER BY id LIMIT $" +
      (params.length + 1) +
      " OFFSET $" +
      (params.length + 2);
    params.push(limit, offset);

    const [itemsResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, search ? [`%${search}%`] : []),
    ]);

    const totalItems = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalItems / limit);

    return {
      items: itemsResult.rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit,
      },
    };
  },

  async getItemById(itemId) {
    const result = await pool.query("SELECT * FROM items WHERE id = $1", [
      itemId,
    ]);
    return result.rows[0];
  },

  async createItem(item) {
    const { id, name, icon } = item;
    const result = await pool.query(
      "INSERT INTO items (id, name, icon) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING RETURNING *",
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
