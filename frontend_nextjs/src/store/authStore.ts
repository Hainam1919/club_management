import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

interface User {
  id: string;
  username: string;
  full_name: string;
  role: 'admin' | 'leader' | 'member';
  email: string;
  faculty?: string;
  interests?: string;
  skills?: string;
  // add other user fields as needed
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  initializeAuth: () => Promise<void>;
  updateMe: (payload: any) => Promise<User>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),

      logout: () => {
        api.logout();
        set({ user: null, token: null, isAuthenticated: false });
      },

      initializeAuth: async () => {
        try {
          const user = await api.getMe();
          set({ user, isAuthenticated: true });
        } catch (error) {
          set({ user: null, token: null, isAuthenticated: false });
        }
      },

      updateMe: async (payload) => {
        const updated = await api.updateMe(payload);
        set({ user: updated });
        return updated;
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
