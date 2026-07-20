import mongoose, { Schema } from "mongoose";
import { AffiliateLink } from "../types";

const affiliateLinkSchema = new Schema<AffiliateLink>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    originalUrl: {
      type: String,
      required: true,
    },
    shortCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    fullLink: {
      type: String,
      required: true,
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
    commissionRate: {
      type: Number,
      default: 0.1, // 10% default
    },
  },
  {
    timestamps: true,
  }
);

affilitateLinkSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<AffiliateLink>(
  "AffiliateLink",
  affiliateLinkSchema
);
