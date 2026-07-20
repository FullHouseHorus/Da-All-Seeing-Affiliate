import axios from "axios";
import SocialPostModel, { ISocialPost } from "../models/SocialPost";
import DiscountLinkModel from "../models/DiscountLink";

export class SocialMediaService {
  /**
   * Post to Facebook
   */
  static async postToFacebook(
    userId: string,
    linkCode: string,
    caption: string,
    imageUrl?: string
  ): Promise<ISocialPost | null> {
    try {
      const facebookToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
      const pageId = process.env.FACEBOOK_PAGE_ID;

      if (!facebookToken || !pageId) {
        console.warn("Facebook credentials not configured");
        return null;
      }

      const discountLink = await DiscountLinkModel.findOne({ linkCode, userId });
      if (!discountLink) return null;

      const shareUrl = `${process.env.BASE_URL || "https://aff.example.com"}/discount/${linkCode}`;
      const fullCaption = `${caption}\n\n🔗 ${shareUrl}\n\n💰 Use code: ${linkCode} for exclusive discounts!`;

      const postData: any = {
        message: fullCaption,
        access_token: facebookToken,
      };

      if (imageUrl) {
        postData.picture = imageUrl;
        postData.link = shareUrl;
      }

      const response = await axios.post(
        `https://graph.facebook.com/${pageId}/feed`,
        postData
      );

      const socialPost = new SocialPostModel({
        userId,
        discountLinkCode: linkCode,
        platform: "facebook",
        postId: response.data.id,
        caption,
        imageUrl,
        status: "posted",
        postedAt: new Date(),
      });

      await socialPost.save();
      return socialPost as ISocialPost;
    } catch (error) {
      console.error("Error posting to Facebook:", error);
      return null;
    }
  }

  /**
   * Post to Instagram
   */
  static async postToInstagram(
    userId: string,
    linkCode: string,
    caption: string,
    imageUrl?: string
  ): Promise<ISocialPost | null> {
    try {
      const instagramToken = process.env.INSTAGRAM_ACCESS_TOKEN;
      const instagramBusinessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

      if (!instagramToken || !instagramBusinessAccountId) {
        console.warn("Instagram credentials not configured");
        return null;
      }

      const discountLink = await DiscountLinkModel.findOne({ linkCode, userId });
      if (!discountLink) return null;

      const shareUrl = `${process.env.BASE_URL || "https://aff.example.com"}/discount/${linkCode}`;
      const fullCaption = `${caption}\n\n🔗 Link in bio or ${shareUrl}\n\n💰 Use code: ${linkCode} for exclusive discounts!`;

      // For Instagram, we need to use the media endpoint
      const postData: any = {
        caption: fullCaption,
        access_token: instagramToken,
      };

      if (imageUrl) {
        postData.image_url = imageUrl;
      }

      const response = await axios.post(
        `https://graph.instagram.com/${instagramBusinessAccountId}/media`,
        postData
      );

      // Publish the media
      await axios.post(
        `https://graph.instagram.com/${response.data.id}/publish`,
        { access_token: instagramToken }
      );

      const socialPost = new SocialPostModel({
        userId,
        discountLinkCode: linkCode,
        platform: "instagram",
        postId: response.data.id,
        caption,
        imageUrl,
        status: "posted",
        postedAt: new Date(),
      });

      await socialPost.save();
      return socialPost as ISocialPost;
    } catch (error) {
      console.error("Error posting to Instagram:", error);
      return null;
    }
  }

  /**
   * Schedule post for Facebook and Instagram
   */
  static async schedulePost(
    userId: string,
    linkCode: string,
    caption: string,
    platforms: Array<"facebook" | "instagram">,
    scheduledFor: Date,
    imageUrl?: string
  ): Promise<ISocialPost[]> {
    try {
      const discountLink = await DiscountLinkModel.findOne({ linkCode, userId });
      if (!discountLink) return [];

      const posts: ISocialPost[] = [];

      for (const platform of platforms) {
        const socialPost = new SocialPostModel({
          userId,
          discountLinkCode: linkCode,
          platform,
          caption,
          imageUrl,
          status: "scheduled",
          scheduledFor,
        });

        await socialPost.save();
        posts.push(socialPost as ISocialPost);
      }

      return posts;
    } catch (error) {
      console.error("Error scheduling post:", error);
      return [];
    }
  }

  /**
   * Process scheduled posts - called by cron job
   */
  static async processScheduledPosts(): Promise<void> {
    try {
      const now = new Date();
      const scheduledPosts = await SocialPostModel.find({
        status: "scheduled",
        scheduledFor: { $lte: now },
      });

      for (const post of scheduledPosts) {
        try {
          let result: ISocialPost | null = null;

          if (post.platform === "facebook") {
            result = await this.postToFacebook(
              post.userId,
              post.discountLinkCode,
              post.caption,
              post.imageUrl || undefined
            );
          } else if (post.platform === "instagram") {
            result = await this.postToInstagram(
              post.userId,
              post.discountLinkCode,
              post.caption,
              post.imageUrl || undefined
            );
          }

          if (result) {
            await SocialPostModel.updateOne(
              { _id: post._id },
              { status: "posted", postedAt: new Date() }
            );
          }
        } catch (err) {
          console.error(`Failed to post to ${post.platform}:`, err);
          await SocialPostModel.updateOne(
            { _id: post._id },
            { status: "failed" }
          );
        }
      }
    } catch (error) {
      console.error("Error processing scheduled posts:", error);
    }
  }

  /**
   * Get social post analytics
   */
  static async getPostAnalytics(postId: string): Promise<any> {
    try {
      const post = await SocialPostModel.findById(postId);
      if (!post) return null;

      return {
        post: post.toObject(),
        analytics: {
          clicks: post.clicks,
          conversions: post.conversions,
          revenue: post.revenue,
          conversionRate: post.clicks > 0 ? (post.conversions / post.clicks) * 100 : 0,
          revenuePerClick: post.clicks > 0 ? (post.revenue / post.clicks).toFixed(2) : 0,
        },
      };
    } catch (error) {
      console.error("Error getting post analytics:", error);
      return null;
    }
  }
}
