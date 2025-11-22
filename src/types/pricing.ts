// Pricing data types for TrueScan Food Scanner

export interface ProductPricing {
  barcode: string;
  currency: string; // ISO currency code (USD, EUR, etc.)
  location?: {
    country?: string;
    region?: string;
    city?: string;
    coordinates?: { lat: number; lng: number };
  };
  prices: PriceEntry[];
  priceRange: {
    min: number;
    max: number;
    average: number;
    median: number;
  };
  trends?: {
    currentPrice: number;
    price30DaysAgo?: number;
    priceChange?: number; // percentage
    priceChangeDirection: 'up' | 'down' | 'stable';
    volatility: 'low' | 'medium' | 'high';
  };
  retailers?: RetailerPrice[];
  lastUpdated: number; // timestamp
  dataQuality: 'high' | 'medium' | 'low' | 'insufficient';
}

export interface PriceEntry {
  price: number;
  currency: string;
  retailer?: string;
  location?: string;
  timestamp: number;
  source: 'api' | 'user' | 'retailer';
  verified: boolean;
}

export interface RetailerPrice {
  retailerName: string;
  price: number;
  currency: string;
  url?: string;
  inStock: boolean;
  location?: string;
}

export interface PriceHistoryEntry {
  timestamp: number;
  price: number;
  currency: string;
  source: string;
}

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  country?: string;
}

export interface LocationInfo {
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// New Zealand pricing types for Vercel backend
export interface ProductPrice {
  store: string;
  chain: string;
  price: number;
  unitPrice?: string;
  special: boolean;
  name: string;
  size?: string;
  url: string;
  updatedAt: string;
}

