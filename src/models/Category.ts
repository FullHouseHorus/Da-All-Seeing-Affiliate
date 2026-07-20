import mongoose, { Schema } from "mongoose";

export interface ICategory {
  _id?: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  parentCategoryId?: string;
  productCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
    },
    icon: {
      type: String,
      default: "",
    },
    parentCategoryId: {
      type: String,
      default: null,
    },
    productCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model<ICategory>("Category", categorySchema);
