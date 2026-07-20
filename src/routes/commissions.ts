import express, { Request, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { CommissionService } from "../services/CommissionService";
import { PaymentService } from "../services/PaymentService";
import UserModel from "../models/User";

const router = express.Router();

/**
 * Get earnings summary
 */
router.get(
  "/earnings",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const earnings = await CommissionService.calculateUserEarnings(
        req.userId || ""
      );

      res.json({
        earnings,
      });
    } catch (error) {
      console.error("Earnings error:", error);
      res.status(500).json({ error: "Failed to fetch earnings" });
    }
  }
);

/**
 * Get commission history
 */
router.get(
  "/history",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      const history = await CommissionService.getCommissionHistory(
        req.userId || "",
        limit,
        offset
      );

      res.json({
        commissions: history,
        count: history.length,
      });
    } catch (error) {
      console.error("History error:", error);
      res.status(500).json({ error: "Failed to fetch commission history" });
    }
  }
);

/**
 * Get pending payments
 */
router.get(
  "/pending",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const pending = await CommissionService.getPendingPayments(
        req.userId || ""
      );

      const totalAmount = pending.reduce((sum, c) => sum + c.amount, 0);

      res.json({
        pendingPayments: pending,
        totalAmount,
      });
    } catch (error) {
      console.error("Pending error:", error);
      res.status(500).json({ error: "Failed to fetch pending payments" });
    }
  }
);

/**
 * Request a payout
 */
router.post(
  "/payout",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { amount, method } = req.body;

      if (!amount || !method) {
        return res
          .status(400)
          .json({ error: "Amount and payment method are required" });
      }

      // Approve commissions for payment
      const approvalResult = await CommissionService.approveCommissionsForPayment(
        req.userId || "",
        amount
      );

      if (!approvalResult.approved) {
        return res.status(400).json({ error: "Failed to approve commissions" });
      }

      // Get user payment method
      const user = await UserModel.findById(req.userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let destination = "";

      switch (method) {
        case "cashapp":
          destination = user.cashAppTag || "";
          break;
        case "applepay":
          destination = user.applePayEmail || "";
          break;
        default:
          destination = user.email;
      }

      if (!destination) {
        return res.status(400).json({
          error: `No ${method} account configured. Please update your payment methods.`,
        });
      }

      // Process payment
      const paymentResult = await PaymentService.processPayment({
        userId: req.userId || "",
        amount: approvalResult.totalAmount,
        method: method as "cashapp" | "applepay" | "stripe",
        destination,
      });

      if (!paymentResult.success) {
        return res.status(500).json({
          error: "Payment processing failed",
          details: paymentResult.error,
        });
      }

      res.json({
        message: "Payout processed successfully",
        payout: {
          amount: approvalResult.totalAmount,
          method,
          transactionId: paymentResult.transactionId,
        },
      });
    } catch (error) {
      console.error("Payout error:", error);
      res.status(500).json({ error: "Failed to process payout" });
    }
  }
);

/**
 * Check payout status
 */
router.get(
  "/payout/:transactionId",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const status = await PaymentService.checkPaymentStatus(
        req.params.transactionId
      );

      res.json({
        transactionId: req.params.transactionId,
        status,
      });
    } catch (error) {
      console.error("Status check error:", error);
      res.status(500).json({ error: "Failed to check payout status" });
    }
  }
);

export default router;
