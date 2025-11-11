import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/config/constants';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Get access token from AsyncStorage
      const token = await AsyncStorage.getItem('accessToken');

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = await AsyncStorage.getItem('refreshToken');

        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;

        // Save new tokens
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', newRefreshToken);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        // You can emit an event here to navigate to login
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: any) => apiClient.post('/auth/register', data),
  login: (data: any) => apiClient.post('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
  refreshToken: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }),
  getMe: () => apiClient.get('/auth/me'),
  verifyEmail: (token: string) => apiClient.post('/auth/verify-email', { token }),
  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    apiClient.post('/auth/reset-password', { token, password }),
  setup2FA: () => apiClient.post('/auth/2fa/setup'),
  verify2FA: (token: string) => apiClient.post('/auth/2fa/verify', { token }),
  disable2FA: (password: string) => apiClient.post('/auth/2fa/disable', { password }),
};

// Products API
export const productsAPI = {
  getProducts: (params?: any) => apiClient.get('/products', { params }),
  getProduct: (id: string) => apiClient.get(`/products/${id}`),
  searchProducts: (query: string, filters?: any) =>
    apiClient.get('/products/search', { params: { q: query, ...filters } }),
  getFeatured: () => apiClient.get('/products/featured'),
  getRecommendations: (productId: string) =>
    apiClient.get(`/products/${productId}/recommendations`),
  getRecentlyViewed: () => apiClient.get('/products/recently-viewed'),
};

// Cart API
export const cartAPI = {
  getCart: () => apiClient.get('/cart'),
  addToCart: (productId: string, quantity: number, variantId?: string) =>
    apiClient.post('/cart/items', { productId, quantity, variantId }),
  updateCartItem: (itemId: string, quantity: number) =>
    apiClient.patch(`/cart/items/${itemId}`, { quantity }),
  removeFromCart: (itemId: string) => apiClient.delete(`/cart/items/${itemId}`),
  clearCart: () => apiClient.delete('/cart'),
};

// Orders API
export const ordersAPI = {
  createOrder: (data: any) => apiClient.post('/orders', data),
  getOrders: (page?: number, limit?: number) =>
    apiClient.get('/orders', { params: { page, limit } }),
  getOrder: (orderId: string) => apiClient.get(`/orders/${orderId}`),
  cancelOrder: (orderId: string, reason?: string) =>
    apiClient.post(`/orders/${orderId}/cancel`, { reason }),
};

// Payments API
export const paymentsAPI = {
  createPaymentIntent: (orderId: string) =>
    apiClient.post('/payments/create-intent', { orderId }),
  getPayment: (orderId: string) => apiClient.get(`/payments/order/${orderId}`),
};

// Wishlist API
export const wishlistAPI = {
  getWishlist: () => apiClient.get('/wishlist'),
  addToWishlist: (productId: string) =>
    apiClient.post('/wishlist/items', { productId }),
  removeFromWishlist: (itemId: string) =>
    apiClient.delete(`/wishlist/items/${itemId}`),
};

// Addresses API
export const addressesAPI = {
  getAddresses: () => apiClient.get('/addresses'),
  getAddress: (id: string) => apiClient.get(`/addresses/${id}`),
  createAddress: (data: any) => apiClient.post('/addresses', data),
  updateAddress: (id: string, data: any) => apiClient.put(`/addresses/${id}`, data),
  deleteAddress: (id: string) => apiClient.delete(`/addresses/${id}`),
  setDefaultAddress: (id: string) => apiClient.patch(`/addresses/${id}/default`),
};

// Reviews API
export const reviewsAPI = {
  createReview: (data: any) => apiClient.post('/reviews', data),
  getProductReviews: (productId: string, page?: number) =>
    apiClient.get(`/products/${productId}/reviews`, { params: { page } }),
  getUserReviews: () => apiClient.get('/reviews/my-reviews'),
  updateReview: (id: string, data: any) => apiClient.put(`/reviews/${id}`, data),
  deleteReview: (id: string) => apiClient.delete(`/reviews/${id}`),
};

export default apiClient;
