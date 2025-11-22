// CORS Proxy utilities for web scraping
// Allows React Native apps to scrape websites that block direct requests

/**
 * Get CORS proxy URL for a given target URL
 * Uses multiple free CORS proxies as fallbacks
 */
export function getCorsProxyUrl(targetUrl: string): string {
  const encodedUrl = encodeURIComponent(targetUrl);
  
  // List of free CORS proxies (in order of preference)
  // Note: These are public proxies - use responsibly
  const proxies = [
    // AllOrigins (reliable, fast)
    `https://api.allorigins.win/get?url=${encodedUrl}`,
    // CORS Anywhere alternatives
    `https://cors-anywhere.herokuapp.com/${targetUrl}`, // May have limitations
    // CORS Proxy alternatives
    `https://api.codetabs.com/v1/proxy?quest=${encodedUrl}`,
  ];
  
  // Return the first proxy URL (can implement rotation logic here)
  return proxies[0];
}

/**
 * Fetch HTML through CORS proxy with error handling and fallbacks
 */
export async function fetchWithCorsProxy(
  url: string,
  options: RequestInit = {}
): Promise<string | null> {
  const maxRetries = 3;
  let lastError: Error | null = null;
  
  // Try direct fetch first (some servers allow CORS)
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Try direct fetch first
      // Request uncompressed HTML to avoid binary/garbled data
      const directResponse = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'identity', // Request uncompressed HTML
          'Cache-Control': 'no-cache',
          ...options.headers,
        },
      });
      
      if (directResponse.ok) {
        // Check if response is compressed
        const contentType = directResponse.headers.get('content-type') || '';
        const contentEncoding = directResponse.headers.get('content-encoding') || '';
        
        let html: string;
        
        // If response is compressed, we need to handle it
        // Note: React Native fetch doesn't automatically decompress, but some servers
        // may send compressed data even when we request 'identity'
        if (contentEncoding.includes('gzip') || contentEncoding.includes('deflate') || contentEncoding.includes('br')) {
          console.warn(`[CORSProxy] Response is compressed (${contentEncoding}) but we can't decompress in React Native`);
          // Try to get as text anyway - may fail
          html = await directResponse.text();
          
          // Check if HTML is actually binary/garbled
          const isBinary = /[\x00-\x08\x0E-\x1F]/.test(html.substring(0, 1000));
          if (isBinary) {
            console.warn(`[CORSProxy] HTML appears to be compressed/binary - cannot decompress in React Native`);
            // Skip this response, will try proxy
            continue;
          }
        } else {
          html = await directResponse.text();
        }
        
        if (html && html.length > 100) {
          // Check if HTML is readable (not binary)
          const isReadable = /<html|<body|<div|<script/i.test(html.substring(0, 500));
          if (isReadable) {
            console.log(`[CORSProxy] Direct fetch succeeded for ${url.substring(0, 50)}...`);
            return html;
          } else {
            console.warn(`[CORSProxy] HTML appears to be binary/unreadable`);
            // Try proxy instead
            continue;
          }
        }
      }
    } catch (error) {
      // Direct fetch failed, will try proxy
      console.log(`[CORSProxy] Direct fetch failed, trying proxy...`);
    }
    
    // Try CORS proxy
    try {
      const proxyUrl = getCorsProxyUrl(url);
      console.log(`[CORSProxy] Fetching through proxy (attempt ${attempt + 1}/${maxRetries})...`);
      
      const proxyResponse = await fetch(proxyUrl, {
        ...options,
        headers: {
          'Accept': 'application/json, text/html, */*',
          ...options.headers,
        },
      });
      
      if (proxyResponse.ok) {
        const data = await proxyResponse.text();
        
        // AllOrigins returns JSON with 'contents' field
        if (proxyUrl.includes('allorigins.win')) {
          try {
            const json = JSON.parse(data);
            if (json.contents) {
              console.log(`[CORSProxy] ✅ Proxy fetch succeeded (AllOrigins)`);
              return json.contents;
            }
          } catch (e) {
            // Not JSON, return raw data
            return data;
          }
        }
        
        // Other proxies may return HTML directly
        if (data && data.length > 100) {
          console.log(`[CORSProxy] ✅ Proxy fetch succeeded`);
          return data;
        }
      }
    } catch (error) {
      lastError = error as Error;
      console.warn(`[CORSProxy] Proxy attempt ${attempt + 1} failed:`, error);
      
      // Wait before retry
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  
  // Only log as warning for expected failures (some sites block scraping)
  // Don't log full error to reduce noise - failures are handled gracefully by calling code
  console.log(`[CORSProxy] ⚠️ Could not fetch ${url.substring(0, 50)}... (site may block scraping)`);
  return null;
}

/**
 * Check if a URL requires CORS proxy
 */
export function requiresCorsProxy(url: string): boolean {
  // Check if URL is from a domain that typically blocks CORS
  const corsBlockingDomains = [
    'walmart.com',
    'target.com',
    'kroger.com',
    'safeway.com',
    'albertsons.com',
    'amazon.com',
    'costco.com',
    'publix.com',
  ];
  
  return corsBlockingDomains.some(domain => url.includes(domain));
}

