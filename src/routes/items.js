const express = require("express");
const router = express.Router();
const itemService = require("../services/itemService");
const marketPriceService = require("../services/marketPriceService");

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const search = req.query.search || "";

    const result = await itemService.getAllItems(page, limit, search);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const item = await itemService.getItemById(itemId);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/auctions", async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const auctions = await itemService.getAuctionsByItemId(itemId);
    res.json(auctions);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/data", async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const marketPrices = await marketPriceService.getMarketPricesByItemId(
      itemId
    );
    res.json(marketPrices);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
