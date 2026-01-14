import { create } from "zustand";
import { db } from "../db/client";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema";
import { getSession, saveSession, clearSession, generateToken } from "../utils/auth";

export interface User {
  id: string;
  email: string;
  firstName: string;
  birthday: string;
  avatarUrl?: string;
  timezone: string;
  greetingStyle?: string;
  workdays?: string;
  createdAt: string;
}

interface UserStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  login: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  login: async (userId: string) => {
    try {
      const userData = await db.query.users.findFirst({
        where: eq(schema.users.id, userId),
      });

      if (!userData) {
        throw new Error("User not found");
      }

      const token = generateToken();
      await saveSession(userId, token);

      set({
        user: {
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          birthday: userData.birthday,
          avatarUrl: userData.avatarUrl || undefined,
          timezone: userData.timezone,
          greetingStyle: userData.greetingStyle || undefined,
          workdays: userData.workdays || undefined,
          createdAt: userData.createdAt,
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  logout: async () => {
    await clearSession();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      const { userId } = await getSession();

      if (!userId) {
        set({ isLoading: false, isAuthenticated: false });
        return false;
      }

      const userData = await db.query.users.findFirst({
        where: eq(schema.users.id, userId),
      });

      if (!userData) {
        await clearSession();
        set({ isLoading: false, isAuthenticated: false });
        return false;
      }

      set({
        user: {
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          birthday: userData.birthday,
          avatarUrl: userData.avatarUrl || undefined,
          timezone: userData.timezone,
          greetingStyle: userData.greetingStyle || undefined,
          workdays: userData.workdays || undefined,
          createdAt: userData.createdAt,
        },
        isAuthenticated: true,
        isLoading: false,
      });

      return true;
    } catch (error) {
      console.error("Auth check error:", error);
      set({ isLoading: false, isAuthenticated: false });
      return false;
    }
  },

  refreshUser: async () => {
    try {
      const currentUser = get().user;
      if (!currentUser) return;

      const userData = await db.query.users.findFirst({
        where: eq(schema.users.id, currentUser.id),
      });

      if (!userData) return;

      set({
        user: {
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          birthday: userData.birthday,
          avatarUrl: userData.avatarUrl || undefined,
          timezone: userData.timezone,
          greetingStyle: userData.greetingStyle || undefined,
          workdays: userData.workdays || undefined,
          createdAt: userData.createdAt,
        },
      });
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  },
}));
