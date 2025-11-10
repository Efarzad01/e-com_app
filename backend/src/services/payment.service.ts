import Stripe from 'stripe';
import config from '../config';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler.middleware';
import { PaymentStatus, OrderStatus } from '@prisma/client';

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2023-10-16',
});

class PaymentService {
  /**
   * Create payment intent for order
   */
  async createPaymentIntent(orderId: string, userId: string) {
    // Get order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        payment: true,
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    if (order.payment) {
      throw new AppError('Payment already exists for this order', 400);
    }

    // Create or retrieve Stripe customer
    let stripeCustomerId = await this.getOrCreateStripeCustomer(userId, order.user.email);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(order.total) * 100), // Convert to cents
      currency: 'usd',
      customer: stripeCustomerId,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: userId,
      },
      description: `Order ${order.orderNumber}`,
    });

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.total,
        currency: 'usd',
        status: PaymentStatus.PENDING,
        method: 'STRIPE',
        stripePaymentId: paymentIntent.id,
        stripeCustomerId: stripeCustomerId,
        metadata: {
          paymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
        },
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: order.total,
      currency: 'usd',
    };
  }

  /**
   * Get or create Stripe customer
   */
  private async getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
    // Check if user already has a Stripe customer ID
    const existingPayment = await prisma.payment.findFirst({
      where: {
        order: { userId },
        stripeCustomerId: { not: null },
      },
      select: { stripeCustomerId: true },
    });

    if (existingPayment?.stripeCustomerId) {
      return existingPayment.stripeCustomerId;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email,
      metadata: { userId },
    });

    return customer.id;
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await this.handleRefund(event.data.object as Stripe.Charge);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const payment = await prisma.payment.findUnique({
      where: { stripePaymentId: paymentIntent.id },
      include: { order: true },
    });

    if (!payment) {
      console.error(`Payment not found for payment intent: ${paymentIntent.id}`);
      return;
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.COMPLETED,
        paidAt: new Date(),
        transactionId: paymentIntent.id,
      },
    });

    // Update order status
    await prisma.order.update({
      where: { id: payment.orderId },
      data: { status: OrderStatus.PROCESSING },
    });
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
    const payment = await prisma.payment.findUnique({
      where: { stripePaymentId: paymentIntent.id },
    });

    if (!payment) {
      console.error(`Payment not found for payment intent: ${paymentIntent.id}`);
      return;
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
      },
    });
  }

  /**
   * Handle refund
   */
  private async handleRefund(charge: Stripe.Charge) {
    const payment = await prisma.payment.findFirst({
      where: { stripePaymentId: charge.payment_intent as string },
    });

    if (!payment) {
      console.error(`Payment not found for charge: ${charge.id}`);
      return;
    }

    const refundAmount = charge.amount_refunded / 100;

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.REFUNDED,
        refundedAt: new Date(),
        refundAmount: refundAmount,
      },
    });

    // Update order status
    await prisma.order.update({
      where: { id: payment.orderId },
      data: { status: OrderStatus.REFUNDED },
    });
  }

  /**
   * Refund payment
   */
  async refundPayment(orderId: string, amount?: number) {
    const payment = await prisma.payment.findUnique({
      where: { orderId },
      include: { order: true },
    });

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new AppError('Only completed payments can be refunded', 400);
    }

    if (!payment.stripePaymentId) {
      throw new AppError('Stripe payment ID not found', 400);
    }

    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentId,
      amount: amount ? Math.round(amount * 100) : undefined, // Partial or full refund
    });

    // Update payment record
    const refundAmount = refund.amount / 100;

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.REFUNDED,
        refundedAt: new Date(),
        refundAmount: refundAmount,
      },
    });

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.REFUNDED },
    });

    return {
      refundId: refund.id,
      amount: refundAmount,
      status: refund.status,
    };
  }

  /**
   * Get payment by order ID
   */
  async getPaymentByOrderId(orderId: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (order.userId !== userId && user?.role !== 'ADMIN') {
      throw new AppError('Unauthorized', 403);
    }

    const payment = await prisma.payment.findUnique({
      where: { orderId },
      include: { order: true },
    });

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    return payment;
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats() {
    const [
      totalPayments,
      completedPayments,
      pendingPayments,
      failedPayments,
      refundedPayments,
      totalRevenue,
      totalRefunded,
    ] = await Promise.all([
      prisma.payment.count(),
      prisma.payment.count({ where: { status: PaymentStatus.COMPLETED } }),
      prisma.payment.count({ where: { status: PaymentStatus.PENDING } }),
      prisma.payment.count({ where: { status: PaymentStatus.FAILED } }),
      prisma.payment.count({ where: { status: PaymentStatus.REFUNDED } }),
      prisma.payment.aggregate({
        where: { status: PaymentStatus.COMPLETED },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: PaymentStatus.REFUNDED },
        _sum: { refundAmount: true },
      }),
    ]);

    return {
      totalPayments,
      completedPayments,
      pendingPayments,
      failedPayments,
      refundedPayments,
      totalRevenue: totalRevenue._sum.amount || 0,
      totalRefunded: totalRefunded._sum.refundAmount || 0,
    };
  }
}

export default new PaymentService();
