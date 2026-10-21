/**
 * Secure Storage Service for BuyMeCart Mobile
 * Encrypted hardware-backed storage for access tokens and sensitive session tokens.
 * Provides fallback in non-native or testing environments.
 */

import { TokenStorageProvider } from "@buymecart/api-client";

class SecureStorageService implements TokenStorageProvider {
  private memoryStore: Map<string, string> = new Map();

  async setItem(key: string, value: string): Promise<void> {
    try {
      // In native Expo environment, this bridges to Expo SecureStore
      // When SecureStore is not mounted, safely fallback to memoryStore
      const SecureStore = (globalThis as unknown as { ExpoSecureStore?: { setItemAsync: (k: string, v: string) => Promise<void> } }).ExpoSecureStore;
      if (SecureStore) {
        await SecureStore.setItemAsync(key, value);
      } else {
        this.memoryStore.set(key, value);
      }
    } catch {
      this.memoryStore.set(key, value);
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const SecureStore = (globalThis as unknown as { ExpoSecureStore?: { getItemAsync: (k: string) => Promise<string | null> } }).ExpoSecureStore;
      if (SecureStore) {
        return await SecureStore.getItemAsync(key);
      }
      return this.memoryStore.get(key) || null;
    } catch {
      return this.memoryStore.get(key) || null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const SecureStore = (globalThis as unknown as { ExpoSecureStore?: { deleteItemAsync: (k: string) => Promise<void> } }).ExpoSecureStore;
      if (SecureStore) {
        await SecureStore.deleteItemAsync(key);
      }
      this.memoryStore.delete(key);
    } catch {
      this.memoryStore.delete(key);
    }
  }

  // TokenStorageProvider implementation
  async getAccessToken(): Promise<string | null> {
    return this.getItem("auth_access_token");
  }

  async setTokens(accessToken: string, refreshToken?: string): Promise<void> {
    await this.setItem("auth_access_token", accessToken);
    if (refreshToken) {
      await this.setItem("auth_refresh_token", refreshToken);
    }
  }

  async clearTokens(): Promise<void> {
    await this.removeItem("auth_access_token");
    await this.removeItem("auth_refresh_token");
  }
}

export const secureStorage = new SecureStorageService();
