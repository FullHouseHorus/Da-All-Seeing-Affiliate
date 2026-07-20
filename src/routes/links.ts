import express, { Request, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { AffiliateLinkService } from "../services/AffiliateLinkService";

const router = express.Router();

/**
 * Create a new affiliate link
 */
router.post(
  "/create",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { originalUrl, commissionRate } = req.body;

      if (!originalUrl) {
        return res.status(400).json({ error: "Original URL is required" });
      }

      const link = await AffiliateLinkService.createAffiliateLink(
        req.userId || "",
        originalUrl,
        commissionRate || 0.1
      );

      if (!link) {
        return res.status(500).json({ error: "Failed to create affiliate link" });
      }

      res.status(201).json({
        message: "Affiliate link created successfully",
        link,
      });
    } catch (error) {
      console.error("Create link error:", error);
      res.status(500).json({ error: "Failed to create affiliate link" });
    }
  }
);

/**
 * Get user's affiliate links
 */
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const links = await AffiliateLinkService.getUserLinks(req.userId || "");

    res.json({
      links,
    });
  } catch (error) {
    console.error("Fetch links error:", error);
    res.status(500).json({ error: "Failed to fetch affiliate links" });
  }
});

/**
 * Get link statistics
 */
router.get(
  "/:linkId/stats",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const stats = await AffiliateLinkService.getLinkStats(req.params.linkId);

      if (!stats) {
        return res.status(404).json({ error: "Link not found" });
      }

      res.json(stats);
    } catch (error) {
      console.error("Stats error:", error);
      res.status(500).json({ error: "Failed to fetch link statistics" });
    }
  }
);

/**
 * Get user performance summary
 */
router.get(
  "/stats/performance",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const performance = await AffiliateLinkService.getUserPerformance(
        req.userId || ""
      );

      res.json(performance);
    } catch (error) {
      console.error("Performance error:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch performance summary" });
    }
  }
);

/**
 * Delete an affiliate link
 */
router.delete(
  "/:linkId",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const deleted = await AffiliateLinkService.deleteLink(
        req.params.linkId,
        req.userId || ""
      );

      if (!deleted) {
        return res.status(404).json({ error: "Link not found" });
      }

      res.json({ message: "Affiliate link deleted successfully" });
    } catch (error) {
      console.error("Delete link error:", error);
      res.status(500).json({ error: "Failed to delete affiliate link" });
    }
  }
);

export default router;
