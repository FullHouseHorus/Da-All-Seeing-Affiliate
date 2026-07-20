import mongoose, { Schema } from "mongoose";
import bcryptjs from "bcryptjs";
import { User } from "../types";

const userSchema = new Schema<User>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    referralCode: {
      type: String,
      required: true,
      unique: true,
    },
    referredBy: {
      type: String,
      default: null,
    },
    cashAppTag: {
      type: String,
      default: null,
    },
    applePayEmail: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as any);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  return bcryptjs.compare(candidatePassword, this.password);
};

export default mongoose.model<User>("User", userSchema);
