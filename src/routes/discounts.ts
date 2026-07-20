import express, { Request, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { DiscountLinkService } from "../services/DiscountLinkService";

const router = express.Router();

/**
 * POST - Create wholesale discount link
 */
router.post(
  "/wholesale",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { products, categories } = req.body;

      const link = await DiscountLinkService.createWholesaleLink(
        req.userId || "",
        products || [],
        categories || []
      );

      if (!link) {
        return res.status(500).json({ error: "Failed to create wholesale link" });
      }

      res.status(201).json({
        message: "Wholesale discount link created",
        link: {
          linkCode: link.linkCode,
          linkType: link.linkType,
          discount: link.discountPercentage,
          products: link.products,
          categories: link.categories,
          shareUrl: `${process.env.BASE_URL || "https://aff.example.com"}/discount/${link.linkCode}`,
        },
      });
    } catch (error) {
      console.error("Error creating wholesale link:", error);
      res.status(500).json({ error: "Failed to create discount link" });
    }
  }
);

/**
 * POST - Create dropshipping discount link
 */
router.post(
  "/dropshipping",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { products, categories } = req.body;

      const link = await DiscountLinkService.createDropshippingLink(
        req.userId || "",
        products || [],
        categories || []
      );

      if (!link) {
        return res.status(500).json({ error: "Failed to create dropshipping link" });
      }

      res.status(201).json({
        message: "Dropshipping discount link created",
        link: {
          linkCode: link.linkCode,
          linkType: link.linkType,
          discount: link.discountPercentage,
          products: link.products,
          categories: link.categories,
          shareUrl: `${process.env.BASE_URL || "https://aff.example.com"}/discount/${link.linkCode}`,
        },
      });
    } catch (error) {
      console.error("Error creating dropshipping link:", error);
      res.status(500).json({ error: "Failed to create discount link" });
    }
  }
);

/**
 * POST - Create bulk discount link
 */
router.post(
  "/bulk",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { discountPercentage, products, categories } = req.body;

      if (!discountPercentage || discountPercentage <= 0 || discountPercentage > 100) {
        return res.status(400).json({ error: "Invalid discount percentage" });
      }

      const link = await DiscountLinkService.createBulkLink(
        req.userId || "",
        discountPercentage,
        products || [],
        categories || []
      );

      if (!link) {
        return res.status(500).json({ error: "Failed to create bulk link" });
      }

      res.status(201).json({
        message: "Bulk discount link created",
        link: {
          linkCode: link.linkCode,
          linkType: link.linkType,
          discount: link.discountPercentage,
          products: link.products,
          categories: link.categories,
          shareUrl: `${process.env.BASE_URL || "https://aff.example.com"}/discount/${link.linkCode}`,
        },
      });
    } catch (error) {
      console.error("Error creating bulk link:", error);
      res.status(500).json({ error: "Failed to create discount link" });
    }
  }
);

/**
 * POST - Create custom discount link
 */
router.post(
  "/custom",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { discountPercentage, products, categories, expiresAt, maxUses } = req.body;

      if (!discountPercentage || discountPercentage <= 0 || discountPercentage > 100) {
        return res.status(400).json({ error: "Invalid discount percentage" });
      }

      const link = await DiscountLinkService.createCustomLink(
        req.userId || "",
        discountPercentage,
        products || [],
        categories || [],
        expiresAt ? new Date(expiresAt) : undefined,
        maxUses
      );

      if (!link) {
        return res.status(500).json({ error: "Failed to create custom link" });
      }

      res.status(201).json({
        message: "Custom discount link created",
        link: {
          linkCode: link.linkCode,
          linkType: link.linkType,
          discount: link.discountPercentage,
          maxUses: link.maxUses,
          expiresAt: link.expiresAt,
          products: link.products,
          categories: link.categories,
          shareUrl: `${process.env.BASE_URL || "https://aff.example.com"}/discount/${link.linkCode}`,
        },
      });
    } catch (error) {
      console.error("Error creating custom link:", error);
      res.status(500).json({ error: "Failed to create discount link" });
    }
  }
);

/**
 * GET - User's discount links
 */
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const links = await DiscountLinkService.getUserLinks(req.userId || "");

    res.json({
      links: links.map((link) => ({
        id: link._id,
        linkCode: link.linkCode,
        linkType: link.linkType,
        discount: link.discountPercentage,
        usageCount: link.currentUses,
        maxUses: link.maxUses,
        isActive: link.isActive,
        expiresAt: link.expiresAt,
        createdAt: link.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching links:", error);
    res.status(500).json({ error: "Failed to fetch discount links" });
  }
});

/**
 * GET - Discount link statistics
 */
router.get(
  "/:linkId/stats",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const stats = await DiscountLinkService.getLinkStats(req.params.linkId);

      if (!stats) {
        return res.status(404).json({ error: "Link not found" });
      }

      res.json(stats);
    } catch (error) {
      console.error("Error getting stats:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  }
);

/**
 * PUT - Update discount link
 */
router.put(
  "/:linkId",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const updates = req.body;

      // Validate updates
      if (
        updates.discountPercentage &&
        (updates.discountPercentage <= 0 || updates.discountPercentage > 100)
      ) {
        return res.status(400).json({ error: "Invalid discount percentage" });
      }

      const updatedLink = await DiscountLinkService.updateLink(
        req.params.linkId,
        req.userId || "",
        updates
      );

      if (!updatedLink) {
        return res.status(404).json({ error: "Link not found" });
      }

      res.json({
        message: "Discount link updated",
        link: updatedLink,
      });
    } catch (error) {
      console.error("Error updating link:", error);
      res.status(500).json({ error: "Failed to update discount link" });
    }
  }
);

/**
 * DELETE - Deactivate discount link
 */
router.delete(
  "/:linkId",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const success = await DiscountLinkService.deactivateLink(
        req.params.linkId,
        req.userId || ""
      );

      if (!success) {
        return res.status(404).json({ error: "Link not found" });
      }

      res.json({ message: "Discount link deactivated" });
    } catch (error) {
      console.error("Error deactivating link:", error);
      res.status(500).json({ error: "Failed to deactivate discount link" });
    }
  }
);

/**
 * POST - Apply discount and create order
 */
router.post("/apply/:linkCode", async (req: Request, res: Response) => {
  try {
    const { linkCode } = req.params;
    const { customerId, orderData } = req.body;

    if (!customerId || !orderData) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await DiscountLinkService.applyDiscountToOrder(
      linkCode,
      customerId,
      orderData
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      message: "Discount applied successfully",
      order: result.order,
    });
  } catch (error) {
    console.error("Error applying discount:", error);
    res.status(500).json({ error: "Failed to apply discount" });
  }
});

export default router;
