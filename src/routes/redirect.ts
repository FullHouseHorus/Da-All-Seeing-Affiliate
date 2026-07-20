import express, { Request, Response } from "express";
import { AffiliateLinkService } from "../services/AffiliateLinkService";

const router = express.Router();

/**
 * Redirect endpoint for tracking clicks
 */
router.get("/:shortCode", async (req: Request, res: Response) => {
  try {
    const { shortCode } = req.params;

    if (!shortCode) {
      return res.status(400).json({ error: "Short code is required" });
    }

    // Track the click and get the original URL
    const originalUrl = await AffiliateLinkService.trackClick(shortCode);

    if (!originalUrl) {
      return res.status(404).json({ error: "Link not found" });
    }

    // Redirect to the original URL with tracking parameters
    res.redirect(originalUrl);
  } catch (error) {
    console.error("Redirect error:", error);
    res.status(500).json({ error: "Redirect failed" });
  }
});

export default router;
