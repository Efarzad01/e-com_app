import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '@/services/api';
import { STORAGE_KEYS } from '@/config/constants';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string, twoFactorCode?: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  login: async (email: string, password: string, twoFactorCode?: string) => {
    try {
      set({ isLoading: true, error: null });

      const response = await authAPI.login({ email, password, twoFactorCode });
      const { user, tokens } = response.data.data;

      // Save tokens and user to AsyncStorage
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken],
        [STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken],
        [STORAGE_KEYS.USER, JSON.stringify(user)],
      ]);

      set({
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 'Login failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  register: async (data: any) => {
    try {
      set({ isLoading: true, error: null });

      const response = await authAPI.register(data);

      set({ isLoading: false });
      // Note: User needs to verify email before logging in
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error?.message || 'Registration failed';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });

      // Call logout API
      await authAPI.logout();

      // Clear AsyncStorage
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER,
      ]);

      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      // Even if API call fails, clear local data
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER,
      ]);

      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  loadUser: async () => {
    try {
      set({ isLoading: true });

      // Get tokens and user from AsyncStorage
      const [[, accessToken], [, refreshToken], [, userString]] =
        await AsyncStorage.multiGet([
          STORAGE_KEYS.ACCESS_TOKEN,
          STORAGE_KEYS.REFRESH_TOKEN,
          STORAGE_KEYS.USER,
        ]);

      if (accessToken && userString) {
        const user = JSON.parse(userString);

        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });

        // Optionally fetch fresh user data
        try {
          const response = await authAPI.getMe();
          const freshUser = response.data.data.user;

          await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(freshUser));
          set({ user: freshUser });
        } catch (error) {
          // If getMe fails, keep using cached user
          console.log('Failed to fetch fresh user data:', error);
        }
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  updateUser: (updatedUser: Partial<User>) => {
    const currentUser = get().user;
    if (currentUser) {
      const newUser = { ...currentUser, ...updatedUser };
      set({ user: newUser });
      AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
    }
  },
}));
