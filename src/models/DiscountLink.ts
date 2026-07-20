import mongoose, { Schema } from "mongoose";

export interface IDiscountLink {
  _id?: string;
  userId: string;
  linkCode: string;
  linkType: "wholesale" | "dropshipping" | "bulk" | "custom";
  discountPercentage: number;
  products: string[]; // Product IDs
  categories: string[]; // Category IDs
  maxUses?: number;
  currentUses: number;
  isActive: boolean;
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const discountLinkSchema = new Schema<IDiscountLink>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    linkCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    linkType: {
      type: String,
      enum: ["wholesale", "dropshipping", "bulk", "custom"],
      required: true,
    },
    discountPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    products: {
      type: [String],
      default: [],
      index: true,
    },
    categories: {
      type: [String],
      default: [],
      index: true,
    },
    maxUses: {
      type: Number,
      default: null,
    },
    currentUses: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

discountLinkSchema.index({ userId: 1, linkCode: 1 });
discountLinkSchema.index({ linkType: 1, isActive: 1 });

export default mongoose.model<IDiscountLink>("DiscountLink", discountLinkSchema);
