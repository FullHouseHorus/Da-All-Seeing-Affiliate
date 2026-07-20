import mongoose, { Schema } from "mongoose";

export interface IProduct {
  _id?: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  costPrice: number;
  affiliateCommissionRate: number;
  wholesale: {
    enabled: boolean;
    minQuantity: number;
    discount: number; // percentage
    price: number;
  };
  dropshipping: {
    enabled: boolean;
    minQuantity: number;
    discount: number;
    price: number;
  };
  bulk: {
    enabled: boolean;
    minQuantity: number;
    discount: number;
    price: number;
  };
  image: string;
  tags: string[];
  inStock: boolean;
  stockQuantity: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const productSchema = new Schema<IProduct>(
  {
    categoryId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    costPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    affiliateCommissionRate: {
      type: Number,
      default: 0.1, // 10% default
    },
    wholesale: {
      enabled: { type: Boolean, default: true },
      minQuantity: { type: Number, default: 100 },
      discount: { type: Number, default: 25 }, // 25% off
      price: { type: Number, default: 0 },
    },
    dropshipping: {
      enabled: { type: Boolean, default: true },
      minQuantity: { type: Number, default: 10 },
      discount: { type: Number, default: 15 }, // 15% off
      price: { type: Number, default: 0 },
    },
    bulk: {
      enabled: { type: Boolean, default: true },
      minQuantity: { type: Number, default: 50 },
      discount: { type: Number, default: 20 }, // 20% off
      price: { type: Number, default: 0 },
    },
    image: {
      type: String,
      default: "",
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    stockQuantity: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Update pricing based on discounts
productSchema.pre("save", function (next) {
  if (this.wholesale.discount > 0) {
    this.wholesale.price = this.price * (1 - this.wholesale.discount / 100);
  }
  if (this.dropshipping.discount > 0) {
    this.dropshipping.price = this.price * (1 - this.dropshipping.discount / 100);
  }
  if (this.bulk.discount > 0) {
    this.bulk.price = this.price * (1 - this.bulk.discount / 100);
  }
  next();
});

productSchema.index({ categoryId: 1, tags: 1, createdAt: -1 });

export default mongoose.model<IProduct>("Product", productSchema);
