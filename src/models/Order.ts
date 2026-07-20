import mongoose, { Schema } from "mongoose";

export interface IOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  discountedPrice: number;
  total: number;
}

export interface IOrder {
  _id?: string;
  affiliateId?: string;
  customerId: string;
  discountLinkCode?: string;
  items: IOrderItem[];
  subtotal: number;
  discountAmount: number;
  discountPercentage: number;
  affiliateCommission: number;
  tax: number;
  total: number;
  orderType: "retail" | "wholesale" | "dropshipping" | "bulk";
  status: "pending" | "completed" | "cancelled" | "refunded";
  paymentMethod: string;
  shippingAddress: string;
  trackingNumber?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
  productId: String,
  productName: String,
  quantity: Number,
  price: Number,
  discountedPrice: Number,
  total: Number,
});

const orderSchema = new Schema<IOrder>(
  {
    affiliateId: {
      type: String,
      default: null,
      index: true,
    },
    customerId: {
      type: String,
      required: true,
      index: true,
    },
    discountLinkCode: {
      type: String,
      default: null,
      index: true,
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountPercentage: {
      type: Number,
      default: 0,
    },
    affiliateCommission: {
      type: Number,
      default: 0,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    orderType: {
      type: String,
      enum: ["retail", "wholesale", "dropshipping", "bulk"],
      default: "retail",
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled", "refunded"],
      default: "pending",
      index: true,
    },
    paymentMethod: {
      type: String,
      default: "",
    },
    shippingAddress: {
      type: String,
      required: true,
    },
    trackingNumber: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

orderSchema.index({ affiliateId: 1, status: 1, createdAt: -1 });
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ orderType: 1, status: 1 });

export default mongoose.model<IOrder>("Order", orderSchema);
