import express, { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import UserModel from "../models/User";
import { generateToken, authMiddleware, AuthRequest } from "../middleware/auth";
import { CommissionService } from "../services/CommissionService";

const router = express.Router();

/**
 * Register a new user
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, username, referralCode } = req.body;

    // Validate input
    if (!email || !password || !username) {
      return res
        .status(400)
        .json({ error: "Email, password, and username are required" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(409).json({ error: "Email or username already exists" });
    }

    // Create new user
    const newUser = new UserModel({
      email,
      password,
      username,
      referralCode: uuidv4().slice(0, 8).toUpperCase(),
      referredBy: referralCode || null,
    });

    await newUser.save();

    // Handle referral bonus
    if (referralCode) {
      const referrer = await UserModel.findOne({
        referralCode: referralCode.toUpperCase(),
      });

      if (referrer) {
        await CommissionService.createReferralBonus(
          referrer._id?.toString() || "",
          newUser._id?.toString() || ""
        );
      }
    }

    const token = generateToken(newUser._id?.toString() || "");

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        username: newUser.username,
        referralCode: newUser.referralCode,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

/**
 * Login user
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required" });
    }

    const user = await UserModel.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await (user as any).comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user._id?.toString() || "");

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        referralCode: user.referralCode,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

/**
 * Get user profile
 */
router.get("/profile", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await UserModel.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const earnings = await CommissionService.calculateUserEarnings(
      req.userId || ""
    );

    res.json({
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        referralCode: user.referralCode,
        cashAppTag: user.cashAppTag,
        applePayEmail: user.applePayEmail,
      },
      earnings,
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

/**
 * Update payment methods
 */
router.put(
  "/payment-methods",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { cashAppTag, applePayEmail } = req.body;

      const user = await UserModel.findByIdAndUpdate(
        req.userId,
        {
          cashAppTag: cashAppTag || undefined,
          applePayEmail: applePayEmail || undefined,
        },
        { new: true }
      );

      res.json({
        message: "Payment methods updated",
        user: {
          id: user?._id,
          cashAppTag: user?.cashAppTag,
          applePayEmail: user?.applePayEmail,
        },
      });
    } catch (error) {
      console.error("Update error:", error);
      res.status(500).json({ error: "Failed to update payment methods" });
    }
  }
);

export default router;
