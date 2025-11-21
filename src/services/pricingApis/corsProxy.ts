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
      const directResponse = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          ...options.headers,
        },
      });
      
      if (directResponse.ok) {
        const html = await directResponse.text();
        if (html && html.length > 100) {
          console.log(`[CORSProxy] Direct fetch succeeded for ${url.substring(0, 50)}...`);
          return html;
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

