export interface User {
  _id?: string;
  email: string;
  password: string;
  username: string;
  referralCode: string;
  referredBy?: string;
  cashAppTag?: string;
  applePayEmail?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AffiliateLink {
  _id?: string;
  userId: string;
  originalUrl: string;
  shortCode: string;
  fullLink: string;
  clicks: number;
  conversions: number;
  revenue: number;
  commissionRate: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Commission {
  _id?: string;
  userId: string;
  affiliateLinkId: string;
  amount: number;
  status: "pending" | "approved" | "paid";
  paymentMethod: "cashapp" | "applepay" | "stripe";
  transactionId?: string;
  createdAt?: Date;
  paidAt?: Date;
}

export interface Referral {
  _id?: string;
  referrerId: string;
  referredUserId: string;
  bonusAmount: number;
  status: "active" | "paid" | "cancelled";
  createdAt?: Date;
}

export interface Dashboard {
  totalEarnings: number;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  pendingPayments: number;
  activeLinks: number;
  referralBonuses: number;
}

export interface PaymentRequest {
  userId: string;
  amount: number;
  method: "cashapp" | "applepay" | "stripe";
  destination: string;
}
