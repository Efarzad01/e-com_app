import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler.middleware';
import redisClient from '../config/redis';
import { Prisma } from '@prisma/client';

interface CreateProductData {
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  brand?: string;
  sku: string;
  price: number;
  comparePrice?: number;
  costPrice?: number;
  categoryId: string;
  stockQuantity: number;
  lowStockThreshold?: number;
  weight?: number;
  dimensions?: string;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
}

interface SearchFilters {
  q?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  brand?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class ProductService {
  /**
   * Create a new product
   */
  async createProduct(data: CreateProductData) {
    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        ...data,
        price: new Prisma.Decimal(data.price),
        comparePrice: data.comparePrice ? new Prisma.Decimal(data.comparePrice) : undefined,
        costPrice: data.costPrice ? new Prisma.Decimal(data.costPrice) : undefined,
        weight: data.weight ? new Prisma.Decimal(data.weight) : undefined,
      },
      include: {
        category: true,
        images: true,
      },
    });

    return product;
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string, userId?: string) {
    const product = await prisma.product.findUnique({
      where: { id, isActive: true },
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        variants: {
          where: { isActive: true },
        },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Increment view count
    await prisma.product.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    // Track recently viewed products for the user
    if (userId) {
      await this.addToRecentlyViewed(userId, id);
    }

    return product;
  }

  /**
   * Get product by slug
   */
  async getProductBySlug(slug: string, userId?: string) {
    const product = await prisma.product.findUnique({
      where: { slug, isActive: true },
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        variants: {
          where: { isActive: true },
        },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Increment view count
    await prisma.product.update({
      where: { id: product.id },
      data: { viewCount: { increment: 1 } },
    });

    // Track recently viewed products
    if (userId) {
      await this.addToRecentlyViewed(userId, product.id);
    }

    return product;
  }

  /**
   * Search and filter products
   */
  async searchProducts(filters: SearchFilters) {
    const {
      q,
      categoryId,
      minPrice,
      maxPrice,
      minRating,
      inStock,
      brand,
      tags,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ProductWhereInput = {
      isActive: true,
    };

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {
        where.price.gte = new Prisma.Decimal(minPrice);
      }
      if (maxPrice !== undefined) {
        where.price.lte = new Prisma.Decimal(maxPrice);
      }
    }

    if (minRating !== undefined) {
      where.averageRating = { gte: new Prisma.Decimal(minRating) };
    }

    if (inStock) {
      where.stockQuantity = { gt: 0 };
    }

    if (brand) {
      where.brand = brand;
    }

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    // Execute query with pagination
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          images: {
            where: { isPrimary: true },
            take: 1,
          },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit: number = 10) {
    const cacheKey = `featured:products:${limit}`;

    // Try to get from cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        isFeatured: true,
        stockQuantity: { gt: 0 },
      },
      include: {
        category: true,
        images: {
          where: { isPrimary: true },
          take: 1,
        },
      },
      take: limit,
      orderBy: { salesCount: 'desc' },
    });

    // Cache for 1 hour
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(products));

    return products;
  }

  /**
   * Get product recommendations
   */
  async getRecommendations(productId: string, limit: number = 6) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { categoryId: true, tags: true },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Find similar products in the same category or with similar tags
    const recommendations = await prisma.product.findMany({
      where: {
        isActive: true,
        id: { not: productId },
        OR: [
          { categoryId: product.categoryId },
          { tags: { hasSome: product.tags } },
        ],
        stockQuantity: { gt: 0 },
      },
      include: {
        category: true,
        images: {
          where: { isPrimary: true },
          take: 1,
        },
      },
      take: limit,
      orderBy: { salesCount: 'desc' },
    });

    return recommendations;
  }

  /**
   * Update product
   */
  async updateProduct(id: string, data: Partial<CreateProductData>) {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // If categoryId is being updated, verify it exists
    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        throw new AppError('Category not found', 404);
      }
    }

    const updateData: any = { ...data };

    // Convert number fields to Decimal
    if (data.price !== undefined) {
      updateData.price = new Prisma.Decimal(data.price);
    }
    if (data.comparePrice !== undefined) {
      updateData.comparePrice = new Prisma.Decimal(data.comparePrice);
    }
    if (data.costPrice !== undefined) {
      updateData.costPrice = new Prisma.Decimal(data.costPrice);
    }
    if (data.weight !== undefined) {
      updateData.weight = new Prisma.Decimal(data.weight);
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        images: true,
      },
    });

    // Invalidate cache
    await redisClient.del(`product:${id}`);

    return updatedProduct;
  }

  /**
   * Delete product (soft delete by setting isActive to false)
   */
  async deleteProduct(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Product deleted successfully' };
  }

  /**
   * Add product images
   */
  async addProductImages(
    productId: string,
    images: Array<{ url: string; altText?: string; isPrimary?: boolean }>
  ) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // If any image is marked as primary, unset existing primary images
    if (images.some((img) => img.isPrimary)) {
      await prisma.productImage.updateMany({
        where: { productId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const createdImages = await Promise.all(
      images.map((image, index) =>
        prisma.productImage.create({
          data: {
            productId,
            url: image.url,
            altText: image.altText,
            isPrimary: image.isPrimary || false,
            sortOrder: index,
          },
        })
      )
    );

    return createdImages;
  }

  /**
   * Add to recently viewed products
   */
  private async addToRecentlyViewed(userId: string, productId: string) {
    const key = `recently_viewed:${userId}`;

    // Add to Redis sorted set with timestamp as score
    await redisClient.zAdd(key, {
      score: Date.now(),
      value: productId,
    });

    // Keep only last 20 viewed products
    await redisClient.zRemRangeByRank(key, 0, -21);

    // Set expiry to 30 days
    await redisClient.expire(key, 30 * 24 * 60 * 60);
  }

  /**
   * Get recently viewed products
   */
  async getRecentlyViewed(userId: string, limit: number = 10) {
    const key = `recently_viewed:${userId}`;

    // Get product IDs from Redis (most recent first)
    const productIds = await redisClient.zRange(key, 0, limit - 1, {
      REV: true,
    });

    if (productIds.length === 0) {
      return [];
    }

    // Fetch products
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
      include: {
        category: true,
        images: {
          where: { isPrimary: true },
          take: 1,
        },
      },
    });

    // Sort products by the order in productIds
    return productIds
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean);
  }

  /**
   * Update stock quantity
   */
  async updateStock(productId: string, quantity: number) {
    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        stockQuantity: quantity,
      },
    });

    return product;
  }

  /**
   * Check stock availability
   */
  async checkStock(productId: string, quantity: number): Promise<boolean> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stockQuantity: true },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return product.stockQuantity >= quantity;
  }
}

export default new ProductService();
