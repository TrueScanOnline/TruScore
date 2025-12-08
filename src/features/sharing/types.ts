// Sharing types and interfaces

import { ProductWithTrustScore } from '../../types/product';
import { TruScoreResult } from '../../lib/truscoreEngine';

export type ShareableItem = 
  | 'truScore'
  | 'recall'
  | 'countryOfManufacture'
  | 'negativeTruScore'
  | 'productInfo'
  | 'insights'
  | 'palmOil'
  | 'nutrition'
  | 'ingredients'
  | 'processing'
  | 'allergens'
  | 'ecoscore';

export type SharePlatform = 
  | 'facebook'
  | 'instagram'
  | 'twitter'
  | 'snapchat'
  | 'tiktok'
  | 'youtube'
  | 'whatsapp'
  | 'sms'
  | 'native'; // Fallback to native share sheet

export interface ShareContent {
  title: string;
  message: string;
  url?: string;
  imageUrl?: string;
  hashtags?: string[];
}

export interface ShareOptions {
  product: ProductWithTrustScore;
  truScore?: TruScoreResult | null;
  item: ShareableItem;
  platform?: SharePlatform;
  customMessage?: string; // User's free text input
  country?: string; // Optional country data for countryOfManufacture sharing
}

export interface ShareResult {
  success: boolean;
  platform: SharePlatform;
  error?: Error;
}


