import express, { Request, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { SocialMediaService } from "../services/SocialMediaService";
import SocialPostModel from "../models/SocialPost";

const router = express.Router();

/**
 * POST to Facebook immediately
 */
router.post(
  "/facebook/post",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { linkCode, caption, imageUrl } = req.body;

      if (!linkCode || !caption) {
        return res.status(400).json({ error: "Link code and caption are required" });
      }

      const result = await SocialMediaService.postToFacebook(
        req.userId || "",
        linkCode,
        caption,
        imageUrl
      );

      if (!result) {
        return res.status(500).json({ error: "Failed to post to Facebook" });
      }

      res.json({
        message: "Posted to Facebook successfully",
        post: result,
      });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Failed to post to Facebook" });
    }
  }
);

/**
 * POST to Instagram immediately
 */
router.post(
  "/instagram/post",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { linkCode, caption, imageUrl } = req.body;

      if (!linkCode || !caption) {
        return res.status(400).json({ error: "Link code and caption are required" });
      }

      const result = await SocialMediaService.postToInstagram(
        req.userId || "",
        linkCode,
        caption,
        imageUrl
      );

      if (!result) {
        return res.status(500).json({ error: "Failed to post to Instagram" });
      }

      res.json({
        message: "Posted to Instagram successfully",
        post: result,
      });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Failed to post to Instagram" });
    }
  }
);

/**
 * Schedule posts for Facebook and Instagram
 */
router.post(
  "/schedule",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { linkCode, caption, platforms, scheduledFor, imageUrl } = req.body;

      if (!linkCode || !caption || !platforms || !scheduledFor) {
        return res
          .status(400)
          .json({ error: "All fields are required" });
      }

      const scheduledDate = new Date(scheduledFor);
      if (scheduledDate < new Date()) {
        return res.status(400).json({ error: "Scheduled date must be in the future" });
      }

      const posts = await SocialMediaService.schedulePost(
        req.userId || "",
        linkCode,
        caption,
        platforms,
        scheduledDate,
        imageUrl
      );

      res.json({
        message: "Posts scheduled successfully",
        posts,
      });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Failed to schedule posts" });
    }
  }
);

/**
 * Get user's social posts
 */
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { platform, status } = req.query;

    const query: any = { userId: req.userId };

    if (platform) {
      query.platform = platform;
    }

    if (status) {
      query.status = status;
    }

    const posts = await SocialPostModel.find(query).sort({ createdAt: -1 });

    res.json({
      posts,
      count: posts.length,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

/**
 * Get post analytics
 */
router.get(
  "/:postId/analytics",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const analytics = await SocialMediaService.getPostAnalytics(req.params.postId);

      if (!analytics) {
        return res.status(404).json({ error: "Post not found" });
      }

      res.json(analytics);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  }
);

export default router;
