import { v4 as uuidv4 } from "uuid";
import CommissionModel from "../models/Commission";
import AffiliateLinkModel from "../models/AffiliateLink";
import UserModel from "../models/User";
import ReferralModel from "../models/Referral";
import { Commission } from "../types";

export class CommissionService {
  /**
   * Create commission when a sale is made
   */
  static async createCommission(
    userId: string,
    affiliateLinkId: string,
    saleAmount: number,
    commissionRate: number = 0.1
  ): Promise<Commission | null> {
    try {
      const commissionAmount = saleAmount * commissionRate;

      const commission = new CommissionModel({
        userId,
        affiliateLinkId,
        amount: commissionAmount,
        paymentMethod: "stripe",
        status: "pending",
      });

      await commission.save();

      // Update affiliate link statistics
      await AffiliateLinkModel.findByIdAndUpdate(
        affiliateLinkId,
        {
          $inc: {
            conversions: 1,
            revenue: commissionAmount,
          },
        },
        { new: true }
      );

      return commission as Commission;
    } catch (error) {
      console.error("Error creating commission:", error);
      return null;
    }
  }

  /**
   * Calculate total earnings for a user
   */
  static async calculateUserEarnings(userId: string): Promise<{
    total: number;
    pending: number;
    paid: number;
    referralBonus: number;
  }> {
    try {
      const commissions = await CommissionModel.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: "$status",
            amount: { $sum: "$amount" },
          },
        },
      ]);

      let pending = 0;
      let paid = 0;

      commissions.forEach((group: any) => {
        if (group._id === "pending") pending = group.amount;
        if (group._id === "paid") paid = group.amount;
      });

      // Calculate referral bonuses
      const referrals = await ReferralModel.find({
        referrerId: userId,
        status: { $in: ["active", "paid"] },
      });

      const referralBonus = referrals.reduce((sum, ref) => sum + ref.bonusAmount, 0);

      return {
        total: pending + paid + referralBonus,
        pending,
        paid,
        referralBonus,
      };
    } catch (error) {
      console.error("Error calculating earnings:", error);
      return { total: 0, pending: 0, paid: 0, referralBonus: 0 };
    }
  }

  /**
   * Get pending payments for payout
   */
  static async getPendingPayments(userId: string): Promise<Commission[]> {
    try {
      return await CommissionModel.find({
        userId,
        status: "pending",
      }).sort({ createdAt: -1 });
    } catch (error) {
      console.error("Error fetching pending payments:", error);
      return [];
    }
  }

  /**
   * Approve commissions for payment
   */
  static async approveCommissionsForPayment(
    userId: string,
    amount?: number
  ): Promise<{ approved: boolean; totalAmount: number; commissionIds: string[] }> {
    try {
      const query: any = { userId, status: "pending" };

      let commissions = await CommissionModel.find(query).sort({
        createdAt: 1,
      });

      if (amount) {
        let total = 0;
        commissions = commissions.filter((c) => {
          if (total + c.amount <= amount) {
            total += c.amount;
            return true;
          }
          return false;
        });
      }

      const commissionIds = commissions.map((c) => c._id?.toString() || "");
      const totalAmount = commissions.reduce((sum, c) => sum + c.amount, 0);

      await CommissionModel.updateMany(
        { _id: { $in: commissionIds } },
        { status: "approved" }
      );

      return {
        approved: true,
        totalAmount,
        commissionIds,
      };
    } catch (error) {
      console.error("Error approving commissions:", error);
      return { approved: false, totalAmount: 0, commissionIds: [] };
    }
  }

  /**
   * Get commission history
   */
  static async getCommissionHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Commission[]> {
    try {
      return await CommissionModel.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset);
    } catch (error) {
      console.error("Error fetching commission history:", error);
      return [];
    }
  }

  /**
   * Handle referral bonus
   */
  static async createReferralBonus(
    referrerId: string,
    referredUserId: string,
    bonusAmount: number = 5.0
  ): Promise<boolean> {
    try {
      const referral = new ReferralModel({
        referrerId,
        referredUserId,
        bonusAmount,
        status: "active",
      });

      await referral.save();

      // Create a commission entry for the referral bonus
      await CommissionModel.create({
        userId: referrerId,
        affiliateLinkId: "referral_bonus",
        amount: bonusAmount,
        status: "pending",
        paymentMethod: "stripe",
      });

      return true;
    } catch (error) {
      console.error("Error creating referral bonus:", error);
      return false;
    }
  }
}
