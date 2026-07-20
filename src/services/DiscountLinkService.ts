import { v4 as uuidv4 } from "uuid";
import DiscountLinkModel, { IDiscountLink } from "../models/DiscountLink";
import CommissionModel from "../models/Commission";
import OrderModel from "../models/Order";

export class DiscountLinkService {
  /**
   * Create a discount link for wholesale
   */
  static async createWholesaleLink(
    userId: string,
    products: string[] = [],
    categories: string[] = []
  ): Promise<IDiscountLink | null> {
    try {
      const linkCode = `WHOLESALE-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      const discountLink = new DiscountLinkModel({
        userId,
        linkCode,
        linkType: "wholesale",
        discountPercentage: 25,
        products,
        categories,
        isActive: true,
      });

      await discountLink.save();
      return discountLink as IDiscountLink;
    } catch (error) {
      console.error("Error creating wholesale link:", error);
      return null;
    }
  }

  /**
   * Create a discount link for dropshipping
   */
  static async createDropshippingLink(
    userId: string,
    products: string[] = [],
    categories: string[] = []
  ): Promise<IDiscountLink | null> {
    try {
      const linkCode = `DROPSHIP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      const discountLink = new DiscountLinkModel({
        userId,
        linkCode,
        linkType: "dropshipping",
        discountPercentage: 15,
        products,
        categories,
        isActive: true,
      });

      await discountLink.save();
      return discountLink as IDiscountLink;
    } catch (error) {
      console.error("Error creating dropshipping link:", error);
      return null;
    }
  }

  /**
   * Create a discount link for bulk orders
   */
  static async createBulkLink(
    userId: string,
    discountPercentage: number,
    products: string[] = [],
    categories: string[] = []
  ): Promise<IDiscountLink | null> {
    try {
      const linkCode = `BULK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      const discountLink = new DiscountLinkModel({
        userId,
        linkCode,
        linkType: "bulk",
        discountPercentage,
        products,
        categories,
        isActive: true,
      });

      await discountLink.save();
      return discountLink as IDiscountLink;
    } catch (error) {
      console.error("Error creating bulk link:", error);
      return null;
    }
  }

  /**
   * Create a custom discount link
   */
  static async createCustomLink(
    userId: string,
    discountPercentage: number,
    products: string[] = [],
    categories: string[] = [],
    expiresAt?: Date,
    maxUses?: number
  ): Promise<IDiscountLink | null> {
    try {
      const linkCode = `${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const discountLink = new DiscountLinkModel({
        userId,
        linkCode,
        linkType: "custom",
        discountPercentage,
        products,
        categories,
        expiresAt,
        maxUses,
        isActive: true,
      });

      await discountLink.save();
      return discountLink as IDiscountLink;
    } catch (error) {
      console.error("Error creating custom link:", error);
      return null;
    }
  }

  /**
   * Validate discount link before use
   */
  static async validateLink(
    linkCode: string
  ): Promise<{ valid: boolean; discount?: IDiscountLink; error?: string }> {
    try {
      const link = await DiscountLinkModel.findOne({ linkCode });

      if (!link) {
        return { valid: false, error: "Discount link not found" };
      }

      if (!link.isActive) {
        return { valid: false, error: "Discount link is inactive" };
      }

      if (link.expiresAt && link.expiresAt < new Date()) {
        return { valid: false, error: "Discount link has expired" };
      }

      if (link.maxUses && link.currentUses >= link.maxUses) {
        return { valid: false, error: "Discount link usage limit reached" };
      }

      return { valid: true, discount: link };
    } catch (error) {
      console.error("Error validating link:", error);
      return { valid: false, error: "Validation error" };
    }
  }

  /**
   * Apply discount and create order with commission
   */
  static async applyDiscountToOrder(
    linkCode: string,
    customerId: string,
    orderData: any
  ): Promise<{
    success: boolean;
    order?: any;
    error?: string;
  }> {
    try {
      const validation = await this.validateLink(linkCode);

      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const discountLink = validation.discount!;
      const discountAmount = orderData.subtotal * (discountLink.discountPercentage / 100);
      const discountedSubtotal = orderData.subtotal - discountAmount;

      // Calculate affiliate commission
      const commissionRate = 0.1; // 10% commission
      const affiliateCommission = discountedSubtotal * commissionRate;

      // Create order
      const order = new OrderModel({
        affiliateId: discountLink.userId,
        customerId,
        discountLinkCode: linkCode,
        items: orderData.items,
        subtotal: orderData.subtotal,
        discountAmount,
        discountPercentage: discountLink.discountPercentage,
        affiliateCommission,
        tax: orderData.tax || 0,
        total: discountedSubtotal + (orderData.tax || 0),
        orderType: discountLink.linkType === "custom" ? "retail" : discountLink.linkType,
        status: "pending",
        paymentMethod: orderData.paymentMethod,
        shippingAddress: orderData.shippingAddress,
      });

      await order.save();

      // Create commission record
      if (discountLink.userId) {
        const commission = new CommissionModel({
          userId: discountLink.userId,
          affiliateLinkId: discountLink._id?.toString(),
          amount: affiliateCommission,
          status: "pending",
          paymentMethod: "stripe",
        });
        await commission.save();
      }

      // Increment usage
      await DiscountLinkModel.findByIdAndUpdate(
        discountLink._id,
        { $inc: { currentUses: 1 } }
      );

      return { success: true, order: order.toObject() };
    } catch (error) {
      console.error("Error applying discount:", error);
      return { success: false, error: "Failed to apply discount" };
    }
  }

  /**
   * Get user's discount links
   */
  static async getUserLinks(userId: string): Promise<IDiscountLink[]> {
    try {
      return await DiscountLinkModel.find({ userId }).sort({ createdAt: -1 });
    } catch (error) {
      console.error("Error fetching user links:", error);
      return [];
    }
  }

  /**
   * Get discount link statistics
   */
  static async getLinkStats(linkId: string): Promise<any> {
    try {
      const link = await DiscountLinkModel.findById(linkId);

      if (!link) return null;

      const orders = await OrderModel.find({ discountLinkCode: link.linkCode });

      const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
      const totalCommissions = orders.reduce((sum, o) => sum + o.affiliateCommission, 0);

      return {
        link: link.toObject(),
        stats: {
          usageCount: link.currentUses,
          maxUses: link.maxUses,
          usagePercentage: link.maxUses ? (link.currentUses / link.maxUses) * 100 : 0,
          totalOrders: orders.length,
          totalRevenue: totalRevenue.toFixed(2),
          totalCommissions: totalCommissions.toFixed(2),
          avgOrderValue: orders.length > 0 ? (totalRevenue / orders.length).toFixed(2) : 0,
        },
      };
    } catch (error) {
      console.error("Error getting link stats:", error);
      return null;
    }
  }

  /**
   * Deactivate discount link
   */
  static async deactivateLink(linkId: string, userId: string): Promise<boolean> {
    try {
      const result = await DiscountLinkModel.findOneAndUpdate(
        { _id: linkId, userId },
        { isActive: false },
        { new: true }
      );

      return !!result;
    } catch (error) {
      console.error("Error deactivating link:", error);
      return false;
    }
  }

  /**
   * Update discount link
   */
  static async updateLink(
    linkId: string,
    userId: string,
    updates: Partial<IDiscountLink>
  ): Promise<IDiscountLink | null> {
    try {
      return await DiscountLinkModel.findOneAndUpdate(
        { _id: linkId, userId },
        updates,
        { new: true }
      );
    } catch (error) {
      console.error("Error updating link:", error);
      return null;
    }
  }
}
