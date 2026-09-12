import { create } from 'zustand';
import { User } from '../types';
import {
  authApi,
  usersApi,
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  getStoredUser,
  setStoredUser,
} from '../lib/api';
import { disconnectSocket } from '../lib/socket';
import { useMeetingStore } from './meetingStore';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  checkAuth: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (data: { email: string; name?: string; avatar?: string; idToken?: string }) => Promise<void>;
  signup: (userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    avatar?: string;
  }) => Promise<void>;
  logout: () => void;
}

const getInitialUser = (): User | null => {
  return getStoredUser();
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: getInitialUser(),
  isAuthenticated: Boolean(getAuthToken() && getStoredUser()),
  isLoading: false,
  error: null,

  checkAuth: async () => {
    const token = getAuthToken();
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      set({ isLoading: true });
      const res = await authApi.me();
      const u = res.user || (res as any).data;
      if (res.success && u) {
        const normalizedUser: User = {
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone || '',
          avatar: u.avatar || '',
          timezone: u.timezone || 'Asia/Kolkata',
          bio: u.bio || '',
          status: (u.status as any) || 'online',
          role: u.role || 'Member',
        };
        setStoredUser(normalizedUser);
        set({ user: normalizedUser, isAuthenticated: true, isLoading: false, error: null });
        return;
      }
      throw new Error('User session invalid');
    } catch (err: any) {
      removeAuthToken();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateProfile: async (updates) => {
    const currentUser = get().user;
    if (!currentUser) return;
    const updatedUser: User = { ...currentUser, ...updates };
    set({ user: updatedUser });
    setStoredUser(updatedUser);

    try {
      await usersApi.updateProfile({
        name: updates.name,
        phone: updates.phone,
        avatar: updates.avatar,
        bio: updates.bio,
        timezone: updates.timezone,
      });
    } catch (err) {
      console.warn('Could not sync profile to backend:', err);
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res: any = await authApi.login({ email, password });
      const token = res.token || res.accessToken || res.data?.accessToken;
      const u = res.user || res.data?.user || res.data;

      if (res.success && token && u) {
        setAuthToken(token);
        disconnectSocket();
        useMeetingStore.getState().resetMeeting();
        const normalizedUser: User = {
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone || '',
          avatar: u.avatar || '',
          timezone: u.timezone || 'Asia/Kolkata',
          bio: u.bio || '',
          status: 'online',
          role: u.role || 'Member',
        };
        setStoredUser(normalizedUser);
        set({ user: normalizedUser, isAuthenticated: true, isLoading: false, error: null });
        return;
      }
      throw new Error(res.message || 'Login failed');
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Invalid email or password' });
      throw err;
    }
  },

  loginWithGoogle: async (googleData: { email: string; name?: string; avatar?: string; idToken?: string }) => {
    set({ isLoading: true, error: null });
    try {
      const res: any = await authApi.loginWithGoogle(googleData);
      const token = res.token || res.accessToken || res.data?.accessToken;
      const u = res.user || res.data?.user || res.data;

      if (res.success && token && u) {
        setAuthToken(token);
        disconnectSocket();
        useMeetingStore.getState().resetMeeting();
        const normalizedUser: User = {
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone || '',
          avatar:
            u.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=10B981&color=fff`,
          timezone: u.timezone || 'Asia/Kolkata',
          bio: u.bio || '',
          status: 'online',
          role: u.role || 'Member',
        };
        setStoredUser(normalizedUser);
        set({ user: normalizedUser, isAuthenticated: true, isLoading: false, error: null });
        return;
      }
      throw new Error(res.message || 'Google sign-in failed');
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Google sign-in failed' });
      throw err;
    }
  },

  signup: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const res: any = await authApi.register({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        phone: userData.phone,
        avatar: userData.avatar,
      });
      const token = res.token || res.accessToken || res.data?.accessToken;
      const u = res.user || res.data?.user || res.data;

      if (res.success && token && u) {
        setAuthToken(token);
        disconnectSocket();
        useMeetingStore.getState().resetMeeting();
        const normalizedUser: User = {
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone || userData.phone || '',
          avatar: u.avatar || userData.avatar || '',
          timezone: u.timezone || 'Asia/Kolkata',
          bio: '',
          status: 'online',
          role: u.role || 'Member',
        };
        setStoredUser(normalizedUser);
        set({ user: normalizedUser, isAuthenticated: true, isLoading: false, error: null });
        return;
      }
      throw new Error(res.message || 'Registration failed');
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Registration failed' });
      throw err;
    }
  },

  logout: () => {
    removeAuthToken();
    disconnectSocket();
    useMeetingStore.getState().resetMeeting();
    try {
      authApi.logout();
    } catch {}
    set({ user: null, isAuthenticated: false, error: null });
  },
}));
