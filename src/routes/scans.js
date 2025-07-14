const express = require("express");
const router = express.Router();
const scanService = require("../services/scanService");

const API_KEY = process.env.API_KEY;

const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized: Invalid API key" });
  }
  next();
};

router.post("/", authenticateApiKey, async (req, res) => {
  try {
    let scanData;

    if (req.body.AuctionScraper_Data) {
      const auctionData = req.body.AuctionScraper_Data;

      if (
        !auctionData.items ||
        !auctionData.auctions ||
        !auctionData.scanInfo ||
        !auctionData.scanInfo.timestamp ||
        !auctionData.scanInfo.count
      ) {
        return res
          .status(400)
          .json({
            error:
              "Invalid scan data: Missing items, auctions, or scanInfo (with timestamp or count)",
          });
      }

      const itemMap = new Map();
      auctionData.items.forEach((item) => {
        if (item.entry) {
          if (!itemMap.has(item.entry)) {
            itemMap.set(item.entry, {
              entry: item.entry,
              name: item.name,
              icon: item.icon,
            });
          }
        }
      });

      scanData = {
        items: Array.from(itemMap.values()),
        auctions: auctionData.auctions.map((auction) => ({
          entry: auction.entry,
          quantity: auction.quantity,
          price: auction.price,
        })),
        scanInfo: {
          timestamp: auctionData.scanInfo.timestamp,
          count: auctionData.scanInfo.count,
        },
      };
    } else {
      scanData = req.body;
      if (
        !scanData.items ||
        !scanData.auctions ||
        !scanData.scanInfo ||
        !scanData.scanInfo.timestamp ||
        !scanData.scanInfo.count
      ) {
        return res
          .status(400)
          .json({
            error:
              "Invalid scan data: Missing items, auctions, or scanInfo (with timestamp or count)",
          });
      }
    }

    const invalidItems = scanData.items.filter(
      (item) => !item.entry || !item.name || !item.icon
    );
    if (invalidItems.length > 0) {
      return res
        .status(400)
        .json({
          error: `Invalid scan data: ${invalidItems.length} items are missing entry, name, or icon`,
        });
    }

    const invalidAuctions = scanData.auctions.filter(
      (auction) => !auction.entry || !auction.quantity || !auction.price
    );
    if (invalidAuctions.length > 0) {
      return res
        .status(400)
        .json({
          error: `Invalid scan data: ${invalidAuctions.length} auctions are missing entry, quantity, or price`,
        });
    }

    const scanId = await scanService.processScan(scanData);
    res.status(201).json({ scan_id: scanId });
  } catch (error) {
    console.error("Error processing scan:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
