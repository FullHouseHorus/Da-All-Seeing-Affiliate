import mongoose, { Schema } from "mongoose";

export interface ISocialPost {
  _id?: string;
  userId: string;
  discountLinkCode: string;
  platform: "facebook" | "instagram" | "tiktok" | "twitter" | "linkedin";
  postId?: string;
  caption: string;
  imageUrl?: string;
  videoUrl?: string;
  status: "scheduled" | "posted" | "failed";
  scheduledFor?: Date;
  postedAt?: Date;
  clicks: number;
  conversions: number;
  revenue: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const socialPostSchema = new Schema<ISocialPost>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    discountLinkCode: {
      type: String,
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ["facebook", "instagram", "tiktok", "twitter", "linkedin"],
      required: true,
    },
    postId: {
      type: String,
      default: null,
    },
    caption: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    videoUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["scheduled", "posted", "failed"],
      default: "scheduled",
      index: true,
    },
    scheduledFor: {
      type: Date,
      default: null,
    },
    postedAt: {
      type: Date,
      default: null,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    conversions: {
      type: Number,
      default: 0,
    },
    revenue: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

socialPostSchema.index({ userId: 1, platform: 1, status: 1 });
socialPostSchema.index({ scheduledFor: 1, status: 1 });

export default mongoose.model<ISocialPost>("SocialPost", socialPostSchema);
