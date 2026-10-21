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
  | 'ecoscore'
  | 'highlights';

export type SharePlatform = 
  | 'facebook'
  | 'instagram'
  | 'twitter'
  | 'snapchat'
  | 'tiktok'
  | 'moreApps'
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
  /** Local file of the rendered share card. Android attaches it to the send. */
  storyImageUri?: string;
  /** Facts already shown on the card, used when the image cannot be attached. */
  receiver?: {
    productName: string;
    section: string;
    summary: string;
  };
  country?: string; // Optional country data for countryOfManufacture sharing
  /** Result checking latch. False withholds every published number on this share. */
  publicationSettled?: boolean;
}

export interface ShareResult {
  success: boolean;
  platform: SharePlatform;
  error?: Error;
}


