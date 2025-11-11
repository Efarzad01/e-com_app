import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler.middleware';
import { OrderStatus, PaymentMethod, Prisma } from '@prisma/client';
import { sendOrderConfirmationEmail } from '../utils/email';

interface CreateOrderData {
  userId: string;
  shippingAddressId: string;
  billingAddressId: string;
  notes?: string;
  paymentMethod: PaymentMethod;
}

class OrderService {
  /**
   * Create order from cart
   */
  async createOrder(data: CreateOrderData) {
    const { userId, shippingAddressId, billingAddressId, notes, paymentMethod } = data;

    // Get user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new AppError('Cart is empty', 400);
    }

    // Verify addresses exist and belong to user
    const [shippingAddress, billingAddress] = await Promise.all([
      prisma.address.findUnique({ where: { id: shippingAddressId } }),
      prisma.address.findUnique({ where: { id: billingAddressId } }),
    ]);

    if (!shippingAddress || shippingAddress.userId !== userId) {
      throw new AppError('Invalid shipping address', 400);
    }

    if (!billingAddress || billingAddress.userId !== userId) {
      throw new AppError('Invalid billing address', 400);
    }

    // Check stock availability for all items
    for (const item of cart.items) {
      if (item.product.stockQuantity < item.quantity) {
        throw new AppError(
          `Insufficient stock for ${item.product.name}`,
          400
        );
      }
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + Number(item.price) * item.quantity;
    }, 0);

    const tax = subtotal * 0.1; // 10% tax (adjust based on location)
    const shippingCost = subtotal > 100 ? 0 : 10; // Free shipping over $100
    const total = subtotal + tax + shippingCost;

    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order with transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          shippingAddressId,
          billingAddressId,
          notes,
          subtotal: new Prisma.Decimal(subtotal),
          tax: new Prisma.Decimal(tax),
          shippingCost: new Prisma.Decimal(shippingCost),
          total: new Prisma.Decimal(total),
          status: OrderStatus.PENDING,
        },
      });

      // Create order items and update stock
      await Promise.all(
        cart.items.map(async (item) => {
          // Create order item
          await tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              price: item.price,
              total: new Prisma.Decimal(Number(item.price) * item.quantity),
            },
          });

          // Update product stock and sales count
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: { decrement: item.quantity },
              salesCount: { increment: item.quantity },
            },
          });
        })
      );

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    // Fetch complete order with items
    const completeOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
        shippingAddress: true,
        billingAddress: true,
      },
    });

    // Send order confirmation email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (user) {
      await sendOrderConfirmationEmail(user.email, orderNumber, total);
    }

    return completeOrder;
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
        shippingAddress: true,
        billingAddress: true,
        payment: true,
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Check if user owns the order (or is admin)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (order.userId !== userId && user?.role !== 'ADMIN') {
      throw new AppError('Unauthorized', 403);
    }

    return order;
  }

  /**
   * Get order by order number
   */
  async getOrderByNumber(orderNumber: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
        shippingAddress: true,
        billingAddress: true,
        payment: true,
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Check if user owns the order (or is admin)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (order.userId !== userId && user?.role !== 'ADMIN') {
      throw new AppError('Unauthorized', 403);
    }

    return order;
  }

  /**
   * Get user's orders
   */
  async getUserOrders(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    where: { isPrimary: true },
                    take: 1,
                  },
                },
              },
            },
          },
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all orders (admin only)
   */
  async getAllOrders(
    page: number = 1,
    limit: number = 20,
    status?: OrderStatus
  ) {
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: OrderStatus) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const updateData: any = { status };

    if (status === OrderStatus.SHIPPED && !order.shippedAt) {
      updateData.shippedAt = new Date();
    }

    if (status === OrderStatus.DELIVERED && !order.deliveredAt) {
      updateData.deliveredAt = new Date();
    }

    if (status === OrderStatus.CANCELLED && !order.cancelledAt) {
      updateData.cancelledAt = new Date();
      // Restore stock
      await this.restoreStock(orderId);
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        payment: true,
      },
    });

    return updatedOrder;
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, userId: string, reason?: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    if (order.status === OrderStatus.DELIVERED) {
      throw new AppError('Cannot cancel delivered order', 400);
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new AppError('Order already cancelled', 400);
    }

    // Restore stock
    await this.restoreStock(orderId);

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return updatedOrder;
  }

  /**
   * Restore stock when order is cancelled
   */
  private async restoreStock(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) return;

    await Promise.all(
      order.items.map((item) =>
        prisma.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: { increment: item.quantity },
            salesCount: { decrement: item.quantity },
          },
        })
      )
    );
  }

  /**
   * Update tracking number
   */
  async updateTracking(orderId: string, trackingNumber: string) {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { trackingNumber },
    });

    return order;
  }

  /**
   * Get order statistics (admin)
   */
  async getOrderStats() {
    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      prisma.order.count({ where: { status: OrderStatus.PROCESSING } }),
      prisma.order.count({ where: { status: OrderStatus.SHIPPED } }),
      prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
      prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
      prisma.order.aggregate({
        where: { status: { not: OrderStatus.CANCELLED } },
        _sum: { total: true },
      }),
    ]);

    return {
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue: totalRevenue._sum.total || 0,
    };
  }
}

export default new OrderService();
