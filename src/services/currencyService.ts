// Currency conversion and formatting service
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CurrencyInfo } from '../types/pricing';

// ExchangeRate-API (free tier, no API key required)
const EXCHANGE_RATE_API = 'https://api.exchangerate-api.com/v4/latest';

interface ExchangeRateResponse {
  base: string;
  date: string;
  rates: Record<string, number>;
}

// Currency symbols mapping
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  HKD: 'HK$',
  SGD: 'S$',
  AUD: 'A$',
  NZD: 'NZ$',
  CAD: 'C$',
  CHF: 'CHF ',
  SEK: 'kr ',
  NOK: 'kr ',
  DKK: 'kr ',
  PLN: 'zł ',
  TRY: '₺',
  RUB: '₽',
  INR: '₹',
  KRW: '₩',
  NGN: '₦',
  ZAR: 'R ',
  BRL: 'R$',
  MXN: 'MX$',
  PHP: '₱',
  THB: '฿',
  IDR: 'Rp ',
  MYR: 'RM ',
  SAR: '﷼',
  AED: 'د.إ ',
  ARS: 'AR$',
};

// Cache exchange rates for 24 hours
const EXCHANGE_RATE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

class CurrencyService {
  private exchangeRateCache: Map<string, { rates: Record<string, number>; timestamp: number }> = new Map();

  /**
   * Get user's local currency based on device locale
   */
  getLocalCurrency(): string {
    try {
      const locale = Localization.getLocales()[0];
      if (locale && locale.currencyCode) {
        return locale.currencyCode.toUpperCase();
      }
      
      // Fallback to region code if currency not available
      if (locale && locale.regionCode) {
        const regionCurrencyMap: Record<string, string> = {
          'US': 'USD',
          'GB': 'GBP',
          'EU': 'EUR',
          'JP': 'JPY',
          'CN': 'CNY',
          'AU': 'AUD',
          'NZ': 'NZD',
          'CA': 'CAD',
        };
        return regionCurrencyMap[locale.regionCode] || 'USD';
      }
      
      return 'USD'; // Default fallback
    } catch (error) {
      console.error('Error getting local currency:', error);
      return 'USD';
    }
  }

  /**
   * Get currency info (symbol, name)
   */
  getCurrencyInfo(currencyCode: string): CurrencyInfo {
    const code = currencyCode.toUpperCase();
    return {
      code,
      symbol: CURRENCY_SYMBOLS[code] || `${code} `,
      name: code,
    };
  }

  /**
   * Format price with currency symbol (symbol before number, e.g., NZ$1.79)
   */
  formatPrice(price: number, currencyCode: string, includeSymbol: boolean = true): string {
    const currency = currencyCode.toUpperCase();
    const symbol = CURRENCY_SYMBOLS[currency] || `${currency} `;
    
    // Format the number with 2 decimal places
    const formattedNumber = price.toFixed(2);
    
    // Always put symbol before number (e.g., NZ$1.79, $1.79, €1.79)
    if (includeSymbol) {
      return `${symbol.trim()}${formattedNumber}`;
    }
    
    return formattedNumber;
  }

  /**
   * Convert price from one currency to another
   */
  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<number | null> {
    if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
      return amount;
    }

    try {
      const exchangeRates = await this.getExchangeRates(fromCurrency);
      if (!exchangeRates) {
        return null;
      }

      const rate = exchangeRates[toCurrency.toUpperCase()];
      if (!rate) {
        console.warn(`Exchange rate not found for ${toCurrency}`);
        return null;
      }

      return amount * rate;
    } catch (error) {
      console.error('Error converting currency:', error);
      return null;
    }
  }

  /**
   * Get exchange rates for a base currency
   */
  async getExchangeRates(baseCurrency: string): Promise<Record<string, number> | null> {
    const base = baseCurrency.toUpperCase();
    const cacheKey = `exchange_rate_${base}`;

    // Check memory cache first
    const cached = this.exchangeRateCache.get(base);
    if (cached && Date.now() - cached.timestamp < EXCHANGE_RATE_CACHE_TTL) {
      return cached.rates;
    }

    // Check AsyncStorage cache
    try {
      const stored = await AsyncStorage.getItem(cacheKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.timestamp && Date.now() - parsed.timestamp < EXCHANGE_RATE_CACHE_TTL) {
          // Update memory cache
          this.exchangeRateCache.set(base, {
            rates: parsed.rates,
            timestamp: parsed.timestamp,
          });
          return parsed.rates;
        }
      }
    } catch (error) {
      console.error('Error reading exchange rate cache:', error);
    }

    // Fetch from API
    try {
      const response = await fetch(`${EXCHANGE_RATE_API}/${base}`);
      if (!response.ok) {
        console.warn(`Exchange rate API error: ${response.status}`);
        return null;
      }

      const data: ExchangeRateResponse = await response.json();
      const rates = data.rates;

      // Cache the rates
      const timestamp = Date.now();
      this.exchangeRateCache.set(base, { rates, timestamp });
      
      try {
        await AsyncStorage.setItem(cacheKey, JSON.stringify({ rates, timestamp }));
      } catch (error) {
        console.error('Error caching exchange rates:', error);
      }

      return rates;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      return null;
    }
  }

  /**
   * Normalize prices to a target currency
   */
  async normalizePrices(
    prices: Array<{ price: number; currency: string }>,
    targetCurrency: string
  ): Promise<Array<{ price: number; currency: string; originalPrice?: number; originalCurrency?: string }>> {
    const target = targetCurrency.toUpperCase();
    
    const normalizedPrices = await Promise.all(
      prices.map(async (priceEntry) => {
        if (priceEntry.currency.toUpperCase() === target) {
          return {
            ...priceEntry,
            price: priceEntry.price,
            currency: target,
          };
        }

        const converted = await this.convertCurrency(
          priceEntry.price,
          priceEntry.currency,
          target
        );

        if (converted === null) {
          // If conversion fails, return original with note
          return {
            ...priceEntry,
            originalPrice: priceEntry.price,
            originalCurrency: priceEntry.currency,
          };
        }

        return {
          price: converted,
          currency: target,
          originalPrice: priceEntry.price,
          originalCurrency: priceEntry.currency,
        };
      })
    );

    return normalizedPrices;
  }
}

export const currencyService = new CurrencyService();

