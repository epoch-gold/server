const express = require("express");
const router = express.Router();
const itemService = require("../services/itemService");
const marketPriceService = require("../services/marketPriceService");

router.get("/", async (req, res) => {
  try {
    const items = await itemService.getAllItems();
    res.json(items);
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