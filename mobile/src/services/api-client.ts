/**
 * Mobile Unified API Client Instance
 * Configured with secure hardware storage and offline mutation queue.
 */

import { UnifiedApiClient } from "@buymecart/api-client";
import { secureStorage } from "./secure-storage";
import { offlineManager } from "./offline-manager";

export const mobileApiClient = new UnifiedApiClient({
  baseUrl: "https://api.buymecart.org",
  tokenStorage: secureStorage,
  offlineQueue: offlineManager.queue,
  isOnlineGetter: () => offlineManager.isOnline(),
  onUnauthorized: () => {
    // Trigger auth renewal or logout event
    secureStorage.clearTokens();
  },
});
