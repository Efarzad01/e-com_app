import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get access token from localStorage or cookies
    const token = localStorage.getItem('accessToken');

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
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
        const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
          withCredentials: true,
        });

        const { accessToken } = response.data.data.tokens;

        // Save new token
        localStorage.setItem('accessToken', accessToken);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API service methods
export const authAPI = {
  register: (data: any) => apiClient.post('/auth/register', data),
  login: (data: any) => apiClient.post('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
  refreshToken: () => apiClient.post('/auth/refresh'),
  getMe: () => apiClient.get('/auth/me'),
  verifyEmail: (token: string) => apiClient.post('/auth/verify-email', { token }),
  forgotPassword: (email: string) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    apiClient.post('/auth/reset-password', { token, password }),
  setup2FA: () => apiClient.post('/auth/2fa/setup'),
  verify2FA: (token: string) => apiClient.post('/auth/2fa/verify', { token }),
  disable2FA: (password: string) => apiClient.post('/auth/2fa/disable', { password }),
};

export const productsAPI = {
  getProducts: (params?: any) => apiClient.get('/products', { params }),
  getProduct: (id: string) => apiClient.get(`/products/${id}`),
  searchProducts: (query: string, filters?: any) =>
    apiClient.get('/products/search', { params: { q: query, ...filters } }),
  getFeatured: () => apiClient.get('/products/featured'),
  getRecommendations: (productId: string) =>
    apiClient.get(`/products/${productId}/recommendations`),
};

export const cartAPI = {
  getCart: () => apiClient.get('/cart'),
  addToCart: (productId: string, quantity: number, variantId?: string) =>
    apiClient.post('/cart/items', { productId, quantity, variantId }),
  updateCartItem: (itemId: string, quantity: number) =>
    apiClient.patch(`/cart/items/${itemId}`, { quantity }),
  removeFromCart: (itemId: string) => apiClient.delete(`/cart/items/${itemId}`),
  clearCart: () => apiClient.delete('/cart'),
};

export const ordersAPI = {
  createOrder: (data: any) => apiClient.post('/orders', data),
  getOrders: (page?: number, limit?: number) =>
    apiClient.get('/orders', { params: { page, limit } }),
  getOrder: (orderId: string) => apiClient.get(`/orders/${orderId}`),
  cancelOrder: (orderId: string, reason?: string) =>
    apiClient.post(`/orders/${orderId}/cancel`, { reason }),
};

export const paymentsAPI = {
  createPaymentIntent: (orderId: string) =>
    apiClient.post('/payments/create-intent', { orderId }),
  getPayment: (orderId: string) => apiClient.get(`/payments/order/${orderId}`),
};

export const wishlistAPI = {
  getWishlist: () => apiClient.get('/wishlist'),
  addToWishlist: (productId: string) =>
    apiClient.post('/wishlist/items', { productId }),
  removeFromWishlist: (itemId: string) =>
    apiClient.delete(`/wishlist/items/${itemId}`),
};

export default apiClient;
