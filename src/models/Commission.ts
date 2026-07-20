import mongoose, { Schema } from "mongoose";
import { Commission } from "../types";

const commissionSchema = new Schema<Commission>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    affiliateLinkId: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "paid"],
      default: "pending",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cashapp", "applepay", "stripe"],
      required: true,
    },
    transactionId: {
      type: String,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

commissionSchema.index({ userId: 1, status: 1, createdAt: -1 });

export default mongoose.model<Commission>("Commission", commissionSchema);
