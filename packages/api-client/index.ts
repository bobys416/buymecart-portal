/**
 * BuyMeCart + IBNK Multi-Platform Unified Ecosystem
 * Shared Reusable API Client with Offline Resiliency & Token Management
 */

export interface ApiSuccess<T> {
  ok: true;
  data: T;
  meta?: {
    timestamp: string;
    requestId: string;
    processingTimeMs?: number;
  };
}

export interface ApiFailure {
  ok: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: unknown;
  };
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export interface TokenStorageProvider {
  getAccessToken(): Promise<string | null>;
  setTokens(accessToken: string, refreshToken?: string): Promise<void>;
  clearTokens(): Promise<void>;
}

export interface QueuedMutation {
  id: string;
  url: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  body: string;
  headers: Record<string, string>;
  createdAt: number;
  retryCount: number;
}

export interface OfflineQueueStorage {
  getQueue(): Promise<QueuedMutation[]>;
  enqueue(item: Omit<QueuedMutation, "id" | "createdAt" | "retryCount">): Promise<void>;
  dequeue(id: string): Promise<void>;
  clear(): Promise<void>;
}

// In-memory fallback token storage (used in SSR / test environments)
class MemoryTokenStorage implements TokenStorageProvider {
  private token: string | null = null;
  async getAccessToken() {
    return this.token;
  }
  async setTokens(token: string) {
    this.token = token;
  }
  async clearTokens() {
    this.token = null;
  }
}

// In-memory offline mutation queue fallback
class MemoryOfflineQueue implements OfflineQueueStorage {
  private queue: QueuedMutation[] = [];
  async getQueue() {
    return [...this.queue];
  }
  async enqueue(item: Omit<QueuedMutation, "id" | "createdAt" | "retryCount">) {
    this.queue.push({
      ...item,
      id: `mut-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
      retryCount: 0,
    });
  }
  async dequeue(id: string) {
    this.queue = this.queue.filter((m) => m.id !== id);
  }
  async clear() {
    this.queue = [];
  }
}

export interface ApiClientConfig {
  baseUrl: string;
  tokenStorage?: TokenStorageProvider;
  offlineQueue?: OfflineQueueStorage;
  onUnauthorized?: () => void;
  isOnlineGetter?: () => boolean;
}

export class UnifiedApiClient {
  private baseUrl: string;
  private tokenStorage: TokenStorageProvider;
  private offlineQueue: OfflineQueueStorage;
  private onUnauthorized?: () => void;
  private isOnline: () => boolean;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.tokenStorage = config.tokenStorage || new MemoryTokenStorage();
    this.offlineQueue = config.offlineQueue || new MemoryOfflineQueue();
    this.onUnauthorized = config.onUnauthorized;
    this.isOnline = config.isOnlineGetter || (() => true);
  }

  public setBaseUrl(newUrl: string): void {
    this.baseUrl = newUrl.replace(/\/$/, "");
  }

  public async get<T>(path: string, params?: Record<string, string | number>): Promise<ApiResult<T>> {
    let url = `${this.baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
    if (params) {
      const qs = Object.entries(params)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&");
      if (qs) url += `?${qs}`;
    }
    return this.execute<T>(url, { method: "GET" });
  }

  public async post<T>(path: string, body?: unknown, allowOfflineQueue: boolean = false): Promise<ApiResult<T>> {
    const url = `${this.baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
    return this.execute<T>(url, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }, allowOfflineQueue);
  }

  public async put<T>(path: string, body?: unknown): Promise<ApiResult<T>> {
    const url = `${this.baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
    return this.execute<T>(url, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async delete<T>(path: string): Promise<ApiResult<T>> {
    const url = `${this.baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
    return this.execute<T>(url, { method: "DELETE" });
  }

  private async execute<T>(
    url: string,
    options: RequestInit,
    allowOfflineQueue: boolean = false
  ): Promise<ApiResult<T>> {
    // Check offline state
    if (!this.isOnline()) {
      if (allowOfflineQueue && options.method && options.method !== "GET") {
        await this.offlineQueue.enqueue({
          url,
          method: options.method as "POST" | "PUT" | "PATCH" | "DELETE",
          body: (options.body as string) || "",
          headers: { "Content-Type": "application/json" },
        });
        return {
          ok: true,
          data: { queuedForSync: true } as unknown as T,
          meta: { timestamp: new Date().toISOString(), requestId: "offline-queued" },
        };
      }
      return {
        ok: false,
        error: {
          code: "OFFLINE_NO_CONNECTIVITY",
          message: "Device is currently offline. Mutation has been queued.",
          statusCode: 0,
        },
      };
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers as Record<string, string>),
    };

    const token = await this.tokenStorage.getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        if (this.onUnauthorized) this.onUnauthorized();
        return {
          ok: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication token expired or revoked",
            statusCode: 401,
          },
        };
      }

      if (!response.ok) {
        let errMessage = `HTTP ${response.status}: ${response.statusText}`;
        let details: unknown = null;
        try {
          const errJson = await response.json();
          errMessage = errJson.message || errMessage;
          details = errJson.details || errJson;
        } catch {
          // Non-JSON response
        }
        return {
          ok: false,
          error: {
            code: `HTTP_${response.status}`,
            message: errMessage,
            statusCode: response.status,
            details,
          },
        };
      }

      const data = (await response.json()) as T;
      return {
        ok: true,
        data,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: response.headers.get("x-request-id") || `req-${Date.now()}`,
        },
      };
    } catch (err: unknown) {
      const error = err as Error;
      return {
        ok: false,
        error: {
          code: "NETWORK_ERROR",
          message: error.message || "Failed to connect to BuyMeCart + IBNK service",
          statusCode: 0,
          details: error.stack,
        },
      };
    }
  }

  /**
   * Replays queued offline mutations when connectivity returns
   */
  public async syncOfflineQueue(): Promise<{ synced: number; failed: number }> {
    const queue = await this.offlineQueue.getQueue();
    let synced = 0;
    let failed = 0;

    for (const item of queue) {
      try {
        const res = await this.execute(item.url, {
          method: item.method,
          body: item.body,
          headers: item.headers,
        });

        if (res.ok) {
          await this.offlineQueue.dequeue(item.id);
          synced++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    return { synced, failed };
  }
}
