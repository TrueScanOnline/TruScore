/**
 * Offline Queue Service
 * Queues failed requests when offline and processes them when connection is restored
 */

import NetInfo from '@react-native-community/netinfo';
import { logger } from '../utils/logger';

interface QueuedRequest<T> {
  request: () => Promise<T>;
  priority: number;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

export class OfflineQueue {
  private queue: QueuedRequest<any>[] = [];
  private isProcessing = false;
  private maxQueueSize = 100;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(maxQueueSize: number = 100) {
    this.maxQueueSize = maxQueueSize;
    this.startProcessing();
  }

  /**
   * Add a request to the queue
   * Higher priority numbers are processed first
   */
  async add<T>(
    request: () => Promise<T>,
    options: {
      priority?: number;
      maxRetries?: number;
    } = {}
  ): Promise<void> {
    const { priority = 0, maxRetries = 3 } = options;

    // Remove oldest low-priority items if queue is full
    if (this.queue.length >= this.maxQueueSize) {
      this.queue.sort((a, b) => b.priority - a.priority);
      this.queue = this.queue.slice(0, this.maxQueueSize - 1);
      logger.warn('Offline queue full, removed oldest low-priority items');
    }

    this.queue.push({
      request,
      priority,
      timestamp: Date.now(),
      retries: 0,
      maxRetries,
    });

    logger.debug(`Added request to offline queue (priority: ${priority}, queue size: ${this.queue.length})`);

    // Try to process immediately if online
    if (await this.isOnline()) {
      this.processQueue();
    }
  }

  /**
   * Check if device is online
   */
  private async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  }

  /**
   * Start periodic processing of queue
   */
  private startProcessing(): void {
    // Check every 10 seconds if we should process queue
    this.processingInterval = setInterval(async () => {
      if (await this.isOnline() && this.queue.length > 0 && !this.isProcessing) {
        this.processQueue();
      }
    }, 10000);
  }

  /**
   * Process queued requests
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    if (!(await this.isOnline())) {
      logger.debug('Device is offline, skipping queue processing');
      return;
    }

    if (this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    logger.info(`Processing offline queue (${this.queue.length} items)`);

    // Sort by priority (highest first), then by timestamp (oldest first)
    this.queue.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return a.timestamp - b.timestamp;
    });

    const itemsToProcess = [...this.queue];
    this.queue = [];

    for (const item of itemsToProcess) {
      try {
        await item.request();
        logger.debug('Successfully processed queued request');
      } catch (error) {
        // Re-queue if retries remaining
        if (item.retries < item.maxRetries) {
          item.retries++;
          this.queue.push(item);
          logger.debug(`Re-queued failed request (retries: ${item.retries}/${item.maxRetries})`);
        } else {
          logger.error('Queued request failed after max retries:', error);
        }
      }
    }

    this.isProcessing = false;
    logger.info(`Finished processing offline queue (${this.queue.length} items remaining)`);
  }

  /**
   * Get queue status
   */
  getStatus(): {
    queueSize: number;
    isProcessing: boolean;
    oldestItemAge: number | null;
  } {
    const oldestItem = this.queue.length > 0
      ? this.queue.reduce((oldest, current) =>
          current.timestamp < oldest.timestamp ? current : oldest
        )
      : null;

    return {
      queueSize: this.queue.length,
      isProcessing: this.isProcessing,
      oldestItemAge: oldestItem
        ? Date.now() - oldestItem.timestamp
        : null,
    };
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = [];
    logger.info('Offline queue cleared');
  }

  /**
   * Cleanup (stop processing interval)
   */
  cleanup(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }
}

// Singleton instance
let offlineQueueInstance: OfflineQueue | null = null;

/**
 * Get the global offline queue instance
 */
export function getOfflineQueue(): OfflineQueue {
  if (!offlineQueueInstance) {
    offlineQueueInstance = new OfflineQueue();
  }
  return offlineQueueInstance;
}
