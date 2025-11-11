import { create } from 'zustand';
import { cartAPI } from '@/services/api';

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  variantId?: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: Array<{ url: string; isPrimary: boolean }>;
    stockQuantity: number;
  };
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity: number, variantId?: string) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  clearError: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isLoading: false,
  error: null,

  fetchCart: async () => {
    try {
      set({ isLoading: true, error: null });

      const response = await cartAPI.getCart();
      const cart = response.data.data;

      set({ cart, isLoading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to fetch cart';
      set({ error: errorMessage, isLoading: false });
    }
  },

  addToCart: async (productId: string, quantity: number, variantId?: string) => {
    try {
      set({ isLoading: true, error: null });

      await cartAPI.addToCart(productId, quantity, variantId);

      // Refresh cart
      await get().fetchCart();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error?.message || 'Failed to add item to cart';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  updateCartItem: async (itemId: string, quantity: number) => {
    try {
      set({ isLoading: true, error: null });

      await cartAPI.updateCartItem(itemId, quantity);

      // Refresh cart
      await get().fetchCart();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error?.message || 'Failed to update cart item';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  removeFromCart: async (itemId: string) => {
    try {
      set({ isLoading: true, error: null });

      await cartAPI.removeFromCart(itemId);

      // Refresh cart
      await get().fetchCart();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error?.message || 'Failed to remove item from cart';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  clearCart: async () => {
    try {
      set({ isLoading: true, error: null });

      await cartAPI.clearCart();

      set({ cart: null, isLoading: false });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error?.message || 'Failed to clear cart';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
