/**
 * Offline Network & Mutation Queue Manager for BuyMeCart Mobile
 * Listens for network connectivity changes and queues offline transactions.
 */

import { OfflineQueueStorage, QueuedMutation } from "@buymecart/api-client";
import { secureStorage } from "./secure-storage";

class MobileOfflineQueue implements OfflineQueueStorage {
  private queueKey = "buymecart_offline_mutation_queue";

  async getQueue(): Promise<QueuedMutation[]> {
    try {
      const data = await secureStorage.getItem(this.queueKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  async enqueue(item: Omit<QueuedMutation, "id" | "createdAt" | "retryCount">): Promise<void> {
    const queue = await this.getQueue();
    const newEntry: QueuedMutation = {
      ...item,
      id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
      retryCount: 0,
    };
    queue.push(newEntry);
    await secureStorage.setItem(this.queueKey, JSON.stringify(queue));
  }

  async dequeue(id: string): Promise<void> {
    const queue = await this.getQueue();
    const filtered = queue.filter((item) => item.id !== id);
    await secureStorage.setItem(this.queueKey, JSON.stringify(filtered));
  }

  async clear(): Promise<void> {
    await secureStorage.removeItem(this.queueKey);
  }
}

class OfflineManager {
  private isOnlineStatus: boolean = true;
  private listeners: Set<(isOnline: boolean) => void> = new Set();
  public queue: MobileOfflineQueue = new MobileOfflineQueue();

  constructor() {
    // In web/simulator, attach navigator.onLine listener if available
    if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
      window.addEventListener("online", () => this.updateOnlineStatus(true));
      window.addEventListener("offline", () => this.updateOnlineStatus(false));
      this.isOnlineStatus = typeof navigator !== "undefined" ? navigator.onLine : true;
    }
  }

  public isOnline(): boolean {
    return this.isOnlineStatus;
  }

  public updateOnlineStatus(online: boolean): void {
    if (this.isOnlineStatus !== online) {
      this.isOnlineStatus = online;
      this.listeners.forEach((listener) => listener(online));
    }
  }

  public subscribe(listener: (isOnline: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const offlineManager = new OfflineManager();
