// Share analytics tracking
// Tracks sharing behavior for optimization and viral growth analysis

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './logger';
import { SharePlatform, ShareableItem } from '../features/sharing/types';

const ANALYTICS_KEY = '@truescan_share_analytics';

interface ShareEvent {
  timestamp: number;
  platform: SharePlatform;
  itemType: ShareableItem;
  productBarcode: string;
  truScore?: number;
  success: boolean;
}

interface ShareAnalytics {
  totalShares: number;
  platformBreakdown: Record<SharePlatform, number>;
  itemTypeBreakdown: Record<ShareableItem, number>;
  recentShares: ShareEvent[];
  mostSharedProducts: Array<{ barcode: string; count: number }>;
  averageTruScore: number;
  successRate: number;
}

class ShareAnalyticsService {
  private maxRecentShares = 1000;

  /**
   * Track a share event
   */
  async trackShare(event: ShareEvent): Promise<void> {
    try {
      const analytics = await this.getAnalytics();
      
      // Update totals
      analytics.totalShares++;
      analytics.platformBreakdown[event.platform] = (analytics.platformBreakdown[event.platform] || 0) + 1;
      analytics.itemTypeBreakdown[event.itemType] = (analytics.itemTypeBreakdown[event.itemType] || 0) + 1;
      
      // Add to recent shares
      analytics.recentShares.push(event);
      if (analytics.recentShares.length > this.maxRecentShares) {
        analytics.recentShares.shift();
      }
      
      // Update most shared products
      const productIndex = analytics.mostSharedProducts.findIndex(p => p.barcode === event.productBarcode);
      if (productIndex >= 0) {
        analytics.mostSharedProducts[productIndex].count++;
      } else {
        analytics.mostSharedProducts.push({ barcode: event.productBarcode, count: 1 });
      }
      analytics.mostSharedProducts.sort((a, b) => b.count - a.count);
      analytics.mostSharedProducts = analytics.mostSharedProducts.slice(0, 50); // Keep top 50
      
      // Update average TruScore
      if (event.truScore !== undefined) {
        const scoresWithTruScore = analytics.recentShares.filter(e => e.truScore !== undefined);
        const sum = scoresWithTruScore.reduce((acc, e) => acc + (e.truScore || 0), 0);
        analytics.averageTruScore = sum / scoresWithTruScore.length;
      }
      
      // Update success rate
      const recentSuccesses = analytics.recentShares.filter(e => e.success).length;
      analytics.successRate = recentSuccesses / analytics.recentShares.length;
      
      await this.saveAnalytics(analytics);
    } catch (error) {
      logger.error('Error tracking share analytics', error);
    }
  }

  /**
   * Get analytics data
   */
  async getAnalytics(): Promise<ShareAnalytics> {
    try {
      const data = await AsyncStorage.getItem(ANALYTICS_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      logger.error('Error reading share analytics', error);
    }
    
    // Return default analytics
    return {
      totalShares: 0,
      platformBreakdown: {} as Record<SharePlatform, number>,
      itemTypeBreakdown: {} as Record<ShareableItem, number>,
      recentShares: [],
      mostSharedProducts: [],
      averageTruScore: 0,
      successRate: 0,
    };
  }

  /**
   * Save analytics data
   */
  private async saveAnalytics(analytics: ShareAnalytics): Promise<void> {
    try {
      await AsyncStorage.setItem(ANALYTICS_KEY, JSON.stringify(analytics));
    } catch (error) {
      logger.error('Error saving share analytics', error);
    }
  }

  /**
   * Get top shared products
   */
  async getTopSharedProducts(limit: number = 10): Promise<Array<{ barcode: string; count: number }>> {
    const analytics = await this.getAnalytics();
    return analytics.mostSharedProducts.slice(0, limit);
  }

  /**
   * Get platform popularity
   */
  async getPlatformPopularity(): Promise<Array<{ platform: SharePlatform; count: number; percentage: number }>> {
    const analytics = await this.getAnalytics();
    const total = analytics.totalShares || 1;
    
    return Object.entries(analytics.platformBreakdown)
      .map(([platform, count]) => ({
        platform: platform as SharePlatform,
        count,
        percentage: (count / total) * 100,
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Clear analytics (for testing)
   */
  async clearAnalytics(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ANALYTICS_KEY);
    } catch (error) {
      logger.error('Error clearing share analytics', error);
    }
  }
}

export const shareAnalytics = new ShareAnalyticsService();
