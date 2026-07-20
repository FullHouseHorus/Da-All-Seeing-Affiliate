import mongoose, { Schema } from "mongoose";
import { Referral } from "../types";

const referralSchema = new Schema<Referral>(
  {
    referrerId: {
      type: String,
      required: true,
      index: true,
    },
    referredUserId: {
      type: String,
      required: true,
      unique: true,
    },
    bonusAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "paid", "cancelled"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

referralSchema.index({ referrerId: 1, status: 1 });

export default mongoose.model<Referral>("Referral", referralSchema);
