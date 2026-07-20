import { v4 as uuidv4 } from "uuid";
import AffiliateLinkModel from "../models/AffiliateLink";
import { AffiliateLink } from "../types";

export class AffiliateLinkService {
  /**
   * Create a new affiliate link
   */
  static async createAffiliateLink(
    userId: string,
    originalUrl: string,
    commissionRate: number = 0.1
  ): Promise<AffiliateLink | null> {
    try {
      const shortCode = this.generateShortCode();
      const baseUrl =
        process.env.BASE_URL || "https://aff.example.com/go/";
      const fullLink = `${baseUrl}${shortCode}`;

      const affiliateLink = new AffiliateLinkModel({
        userId,
        originalUrl,
        shortCode,
        fullLink,
        commissionRate,
      });

      await affiliateLink.save();
      return affiliateLink as AffiliateLink;
    } catch (error) {
      console.error("Error creating affiliate link:", error);
      return null;
    }
  }

  /**
   * Track a link click
   */
  static async trackClick(shortCode: string): Promise<string | null> {
    try {
      const link = await AffiliateLinkModel.findOneAndUpdate(
        { shortCode },
        { $inc: { clicks: 1 } },
        { new: true }
      );

      if (!link) return null;

      return link.originalUrl;
    } catch (error) {
      console.error("Error tracking click:", error);
      return null;
    }
  }

  /**
   * Get user's affiliate links
   */
  static async getUserLinks(userId: string): Promise<AffiliateLink[]> {
    try {
      return await AffiliateLinkModel.find({ userId }).sort({
        createdAt: -1,
      });
    } catch (error) {
      console.error("Error fetching user links:", error);
      return [];
    }
  }

  /**
   * Get link statistics
   */
  static async getLinkStats(linkId: string): Promise<any> {
    try {
      const link = await AffiliateLinkModel.findById(linkId);

      if (!link) return null;

      const conversionRate =
        link.clicks > 0 ? (link.conversions / link.clicks) * 100 : 0;

      return {
        ...link.toObject(),
        conversionRate: conversionRate.toFixed(2),
      };
    } catch (error) {
      console.error("Error getting link stats:", error);
      return null;
    }
  }

  /**
   * Get performance summary for user
   */
  static async getUserPerformance(userId: string): Promise<any> {
    try {
      const links = await AffiliateLinkModel.find({ userId });

      const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0);
      const totalConversions = links.reduce(
        (sum, link) => sum + link.conversions,
        0
      );
      const totalRevenue = links.reduce((sum, link) => sum + link.revenue, 0);

      const conversionRate =
        totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
      const avgRevenuePerLink =
        links.length > 0 ? totalRevenue / links.length : 0;

      return {
        totalLinks: links.length,
        totalClicks,
        totalConversions,
        totalRevenue,
        conversionRate: conversionRate.toFixed(2),
        avgRevenuePerLink: avgRevenuePerLink.toFixed(2),
      };
    } catch (error) {
      console.error("Error getting user performance:", error);
      return {};
    }
  }

  /**
   * Delete an affiliate link
   */
  static async deleteLink(linkId: string, userId: string): Promise<boolean> {
    try {
      const result = await AffiliateLinkModel.findOneAndDelete({
        _id: linkId,
        userId,
      });

      return !!result;
    } catch (error) {
      console.error("Error deleting link:", error);
      return false;
    }
  }

  /**
   * Generate a short code
   */
  private static generateShortCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }
}
