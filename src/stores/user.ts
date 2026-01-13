import { create } from "zustand";

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  timezone: string;
}

interface UserStore {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  isAuthenticated: false,
}));
