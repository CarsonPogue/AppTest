import bcrypt from "bcryptjs";
import * as SecureStore from "expo-secure-store";

const AUTH_TOKEN_KEY = "auth_token";
const USER_ID_KEY = "user_id";

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Session management
export async function saveSession(userId: string, token: string): Promise<void> {
  await SecureStore.setItemAsync(USER_ID_KEY, userId);
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
}

export async function getSession(): Promise<{
  userId: string | null;
  token: string | null;
}> {
  const userId = await SecureStore.getItemAsync(USER_ID_KEY);
  const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  return { userId, token };
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(USER_ID_KEY);
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
}

// Simple token generation (in production, use JWT or similar)
export function generateToken(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Password validation
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
