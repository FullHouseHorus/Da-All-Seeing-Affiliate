import express, { Request, Response } from "express";
import { authMiddleware } from "../middleware/auth";
import { ProductService } from "../services/ProductService";
import ProductModel from "../models/Product";

const router = express.Router();

/**
 * GET all products with optional filtering
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const { category, search, type, limit = 50, offset = 0 } = req.query;
    const parsedLimit = Math.min(parseInt(limit as string) || 50, 100);
    const parsedOffset = parseInt(offset as string) || 0;

    let products: any[] = [];

    if (search) {
      products = await ProductService.searchProducts(
        search as string,
        parsedLimit,
        parsedOffset
      );
    } else if (type === "wholesale") {
      products = await ProductService.getWholesaleProducts(parsedLimit, parsedOffset);
    } else if (type === "dropshipping") {
      products = await ProductService.getDropshippingProducts(parsedLimit, parsedOffset);
    } else if (type === "bulk") {
      products = await ProductService.getBulkProducts(parsedLimit, parsedOffset);
    } else if (category) {
      products = await ProductService.getProductsByCategory(
        category as string,
        parsedLimit,
        parsedOffset
      );
    } else {
      products = await ProductModel.find()
        .limit(parsedLimit)
        .skip(parsedOffset)
        .sort({ createdAt: -1 });
    }

    res.json({
      products,
      count: products.length,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

/**
 * GET product by ID
 */
router.get("/:productId", async (req: Request, res: Response) => {
  try {
    const product = await ProductModel.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

/**
 * GET product pricing for specific order type
 */
router.get("/:productId/pricing/:orderType", async (req: Request, res: Response) => {
  try {
    const { productId, orderType } = req.params;
    const validOrderTypes = ["retail", "wholesale", "dropshipping", "bulk"];

    if (!validOrderTypes.includes(orderType)) {
      return res.status(400).json({ error: "Invalid order type" });
    }

    const pricing = await ProductService.getProductPricing(
      productId,
      orderType as any
    );

    if (!pricing) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(pricing);
  } catch (error) {
    console.error("Error getting pricing:", error);
    res.status(500).json({ error: "Failed to get pricing" });
  }
});

/**
 * GET wholesale products
 */
router.get("/category/wholesale", async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const parsedLimit = Math.min(parseInt(limit as string) || 50, 100);
    const parsedOffset = parseInt(offset as string) || 0;

    const products = await ProductService.getWholesaleProducts(parsedLimit, parsedOffset);

    res.json({
      type: "wholesale",
      products,
      count: products.length,
    });
  } catch (error) {
    console.error("Error fetching wholesale products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

/**
 * GET dropshipping products
 */
router.get("/category/dropshipping", async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const parsedLimit = Math.min(parseInt(limit as string) || 50, 100);
    const parsedOffset = parseInt(offset as string) || 0;

    const products = await ProductService.getDropshippingProducts(
      parsedLimit,
      parsedOffset
    );

    res.json({
      type: "dropshipping",
      products,
      count: products.length,
    });
  } catch (error) {
    console.error("Error fetching dropshipping products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

/**
 * GET bulk products
 */
router.get("/category/bulk", async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const parsedLimit = Math.min(parseInt(limit as string) || 50, 100);
    const parsedOffset = parseInt(offset as string) || 0;

    const products = await ProductService.getBulkProducts(parsedLimit, parsedOffset);

    res.json({
      type: "bulk",
      products,
      count: products.length,
    });
  } catch (error) {
    console.error("Error fetching bulk products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

export default router;
