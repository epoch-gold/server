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
    if (!auctions.length) {
      return res.status(404).json({ error: "No auctions found for this item" });
    }
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

    if (!marketPrices.length) {
      return res
        .status(404)
        .json({ error: "No market price data found for this item" });
    }

    res.json(marketPrices);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;