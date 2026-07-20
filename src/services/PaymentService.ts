import Stripe from "stripe";
import { Client } from "square";
import { PaymentRequest, Commission } from "../types";
import CommissionModel from "../models/Commission";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-08-16",
});

const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: "production",
});

export class PaymentService {
  /**
   * Process payment via Stripe (Universal, recommended for most cases)
   */
  static async processStripePayment(
    amount: number,
    paymentMethod: string,
    description: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const payment = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        payment_method_types: ["card"],
        description,
      });

      return {
        success: true,
        transactionId: payment.id,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as any).message,
      };
    }
  }

  /**
   * Process payment via Cash App (using Square API)
   */
  static async processCashAppPayment(
    amount: number,
    cashAppTag: string,
    description: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const paymentsApi = squareClient.getPaymentsApi();

      const payment = await paymentsApi.createPayment({
        sourceId: `CASH_APP:${cashAppTag}`,
        amountMoney: {
          amount: Math.round(amount * 100),
          currency: "USD",
        },
        note: description,
        idempotencyKey: `${Date.now()}-${Math.random()}`,
      });

      return {
        success: true,
        transactionId: payment.result?.payment?.id,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as any).message,
      };
    }
  }

  /**
   * Process payment via Apple Pay (using Stripe)
   */
  static async processApplePayPayment(
    amount: number,
    applePayToken: string,
    description: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const payment = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "usd",
        payment_method_types: ["card"],
        description: `Apple Pay - ${description}`,
      });

      return {
        success: true,
        transactionId: payment.id,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as any).message,
      };
    }
  }

  /**
   * Process payment request with automatic method selection
   */
  static async processPayment(
    request: PaymentRequest
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      let result;

      switch (request.method) {
        case "cashapp":
          result = await this.processCashAppPayment(
            request.amount,
            request.destination,
            `Commission payment to ${request.userId}`
          );
          break;

        case "applepay":
          result = await this.processApplePayPayment(
            request.amount,
            request.destination,
            `Commission payment to ${request.userId}`
          );
          break;

        case "stripe":
        default:
          result = await this.processStripePayment(
            request.amount,
            request.destination,
            `Commission payment to ${request.userId}`
          );
      }

      if (result.success) {
        // Update commission status
        await CommissionModel.updateOne(
          { userId: request.userId, status: "pending" },
          {
            status: "paid",
            transactionId: result.transactionId,
            paidAt: new Date(),
          },
          { multi: true }
        );
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: (error as any).message,
      };
    }
  }

  /**
   * Check payment status
   */
  static async checkPaymentStatus(
    transactionId: string
  ): Promise<{ status: string; error?: string }> {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(transactionId);
      return {
        status: paymentIntent.status,
      };
    } catch (error) {
      return {
        status: "error",
        error: (error as any).message,
      };
    }
  }
}
