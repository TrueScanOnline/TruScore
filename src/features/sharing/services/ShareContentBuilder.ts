// Share content builder
// Creates platform-optimized content for sharing
// Uses universal links that open the app directly or redirect to app stores

import { ShareContent, ShareOptions, ShareableItem } from '../types';
import { generateUniversalLink } from '../../../utils/linking';
import { logger } from '../../../utils/logger';
import { Platform } from 'react-native';

export class ShareContentBuilder {
  /**
   * Generate universal link with app store fallback
   * Universal links (https://truescan.app) automatically:
   * - Open app if installed (iOS Universal Links / Android App Links)
   * - Redirect to App Store/Play Store if app not installed
   */
  private static generateUniversalLink(barcode: string): string {
    return generateUniversalLink(barcode);
  }

  /**
   * Build share content based on item type and platform
   * All share content now uses universal links that open the app directly
   * or redirect to app stores if the app is not installed
   */
  static buildContent(options: ShareOptions): ShareContent {
    const { product, truScore, item, platform = 'native' } = options;
    // Use universal link instead of website URL - opens app directly or redirects to app stores
    const universalLink = this.generateUniversalLink(product.barcode);
    const productName = product.product_name || product.product_name_en || 'this product';

    switch (item) {
      case 'truScore':
        return this.buildTruScoreContent(product, truScore, universalLink, productName, platform);
      
      case 'recall':
        return this.buildRecallContent(product, universalLink, productName, platform);
      
      case 'countryOfManufacture':
        return this.buildCountryContent(product, universalLink, productName, platform, options);
      
      case 'negativeTruScore':
        return this.buildNegativeTruScoreContent(product, truScore, universalLink, productName, platform);
      
      case 'insights':
        return this.buildInsightsContent(product, truScore, universalLink, productName, platform);
      
      case 'palmOil':
        return this.buildPalmOilContent(product, universalLink, productName, platform);
      
      case 'nutrition':
        return this.buildNutritionContent(product, universalLink, productName, platform);
      
      case 'ingredients':
        return this.buildIngredientsContent(product, universalLink, productName, platform);
      
      case 'processing':
        return this.buildProcessingContent(product, universalLink, productName, platform);
      
      case 'allergens':
        return this.buildAllergensContent(product, universalLink, productName, platform);
      
      case 'ecoscore':
        return this.buildEcoScoreContent(product, universalLink, productName, platform);
      
      case 'productInfo':
      default:
        return this.buildProductInfoContent(product, truScore, universalLink, productName, platform);
    }
  }

  private static buildTruScoreContent(
    product: ShareOptions['product'],
    truScore: ShareOptions['truScore'],
    universalLink: string,
    productName: string,
    platform: ShareOptions['platform']
  ): ShareContent {
    const score = truScore?.truscore ?? product.trust_score ?? 0;
    const scoreLabel = this.getScoreLabel(score);
    const body = truScore?.breakdown.Body ?? product.trust_score_breakdown?.body ?? 0;
    const planet = truScore?.breakdown.Planet ?? product.trust_score_breakdown?.planet ?? 0;
    const ethics = truScore?.breakdown.Ethics ?? product.trust_score_breakdown?.ethics ?? 0;
    const open = truScore?.breakdown.Open ?? product.trust_score_breakdown?.open ?? 0;

    // VIRAL HOOKS - Platform-optimized for maximum engagement
    const emoji = score >= 80 ? '🌟' : score >= 60 ? '✅' : score >= 40 ? '⚠️' : '❌';
    
    // Score-based viral hooks
    let hook: string;
    let curiosityGap: string;
    
    if (score >= 80) {
      hook = `🌟 ${productName} scored EXCELLENT!`;
      curiosityGap = `This is one of the best products I've scanned. See why it got ${score}/100!`;
    } else if (score >= 60) {
      hook = `✅ Just scanned ${productName}`;
      curiosityGap = `Here's what TruScore revealed - you'll want to see this!`;
    } else if (score >= 40) {
      hook = `⚠️ ${productName} has some concerns`;
      curiosityGap = `The TruScore breakdown will surprise you...`;
    } else {
      hook = `❌ You need to see ${productName}'s score`;
      curiosityGap = `This is why you should check products before buying!`;
    }

    const title = `${emoji} ${productName} - TruScore ${score}/100`;
    const message = `${hook}\n\n${curiosityGap}\n\n` +
      `📊 TruScore: ${score}/100\n` +
      `• Body: ${body}/25\n` +
      `• Planet: ${planet}/25\n` +
      `• Ethics: ${ethics}/25\n` +
      `• Open: ${open}/25\n\n` +
      `🔍 Tap to see the full breakdown\n` +
      `📱 Free app - no sign-up needed\n\n` +
      `#TruScore #ProductScan #FoodScanner #HealthyEating #EthicalShopping #KnowWhatYouBuy`;

    return {
      title,
      message,
      url: universalLink,
      imageUrl: product.image_url,
      hashtags: ['TruScore', 'ProductScan', 'FoodScanner', 'HealthyEating', 'EthicalShopping', 'KnowWhatYouBuy'],
    };
  }

  private static buildRecallContent(
    product: ShareOptions['product'],
    universalLink: string,
    productName: string,
    platform: ShareOptions['platform']
  ): ShareContent {
    const recalls = product.recalls || [];
    const recallCount = recalls.length;
    const latestRecall = recalls[0];

    // VIRAL HOOK for recalls - urgency and concern
    const title = `🚨 URGENT: ${productName} Recall Alert`;
    const message = `⚠️ IMPORTANT SAFETY ALERT ⚠️\n\n` +
      `${productName} has ${recallCount} active recall${recallCount !== 1 ? 's' : ''}!\n\n` +
      (latestRecall ? `🚨 Reason: ${latestRecall.reason}\n` : '') +
      (latestRecall?.recallDate ? `📅 Date: ${latestRecall.recallDate}\n` : '') +
      `\n🔍 Check if you have this product - tap for full details\n` +
      `📱 Free TruScore app - scan any product for recalls\n\n` +
      `#FoodRecall #ProductSafety #TruScore #FoodSafetyAlert #RecallAlert`;

    return {
      title,
      message,
      url: universalLink,
      hashtags: ['FoodRecall', 'ProductSafety', 'TruScore', 'FoodSafetyAlert', 'RecallAlert'],
    };
  }

  private static buildCountryContent(
    product: ShareOptions['product'],
    universalLink: string,
    productName: string,
    platform: ShareOptions['platform'],
    options?: ShareOptions
  ): ShareContent {
    // Extract country from options (user-contributed), product, or default to Unknown
    let country = 'Unknown';
    
    if (options?.country) {
      // Use country from options (user-contributed data)
      country = options.country;
    } else {
      // Try to extract from product
      const { extractManufacturingCountry } = require('../../../services/openFoodFacts');
      const extractedCountry = extractManufacturingCountry(product);
      if (extractedCountry) {
        country = extractedCountry;
      } else if (product.manufacturing_places) {
        country = product.manufacturing_places;
      } else if (product.origins) {
        country = product.origins;
      }
    }

    const title = `Country of Manufacture: ${productName}`;
    const message = `${title}\n\n` +
      `Manufactured in: ${country}\n\n` +
      `🔍 Tap to view full details in TruScore`;

    return {
      title,
      message,
      url: universalLink,
      hashtags: ['CountryOfOrigin', 'Manufacturing', 'TruScore'],
    };
  }

  private static buildNegativeTruScoreContent(
    product: ShareOptions['product'],
    truScore: ShareOptions['truScore'],
    universalLink: string,
    productName: string,
    platform: ShareOptions['platform']
  ): ShareContent {
    const score = truScore?.truscore ?? product.trust_score ?? 0;

    const title = `⚠️ Low TruScore Alert: ${productName}`;
    const message = `${title}\n\n` +
      `TruScore: ${score}/100\n\n` +
      `This product has a low trust score. Check the details to understand why.\n\n` +
      `🔍 Tap to view breakdown in TruScore`;

    return {
      title,
      message,
      url: universalLink,
      hashtags: ['LowTruScore', 'ProductAlert', 'TruScore'],
    };
  }

  private static buildProductInfoContent(
    product: ShareOptions['product'],
    truScore: ShareOptions['truScore'],
    universalLink: string,
    productName: string,
    platform: ShareOptions['platform']
  ): ShareContent {
    const score = truScore?.truscore ?? product.trust_score ?? 0;
    const emoji = score >= 80 ? '🌟' : score >= 60 ? '✅' : score >= 40 ? '⚠️' : '❌';

    // VIRAL HOOK - curiosity and discovery
    const title = `${emoji} Discovered ${productName} on TruScore`;
    const message = `🔍 Just scanned ${productName}!\n\n` +
      `TruScore: ${score}/100\n\n` +
      `See nutrition, ingredients, sustainability & more\n` +
      `📱 Free app - scan any product instantly\n\n` +
      `#TruScore #ProductScan #FoodScanner #KnowWhatYouBuy #ProductDiscovery`;

    return {
      title,
      message,
      url: universalLink,
      imageUrl: product.image_url,
      hashtags: ['TruScore', 'ProductScan', 'FoodScanner', 'KnowWhatYouBuy', 'ProductDiscovery'],
    };
  }

  private static buildInsightsContent(
    product: ShareOptions['product'],
    truScore: ShareOptions['truScore'],
    universalLink: string,
    productName: string,
    platform: ShareOptions['platform']
  ): ShareContent {
    const insights = truScore?.insights || [];
    const title = `💡 Insights: ${productName}`;
    const message = `Interesting insights about ${productName}:\n\n` +
      (insights.length > 0 
        ? insights.slice(0, 3).map(insight => `• ${insight.reason}`).join('\n') + '\n\n'
        : 'Check out the insights in TruScore!\n\n') +
      `🔍 Tap to view insights in TruScore\n\n` +
      `#TruScore #FoodInsights #ProductScan`;

    return {
      title,
      message,
      url: universalLink,
      imageUrl: product.image_url,
      hashtags: ['TruScore', 'FoodInsights', 'ProductScan'],
    };
  }

  private static buildPalmOilContent(
    product: ShareOptions['product'],
    universalLink: string,
    productName: string,
    platform: ShareOptions['platform']
  ): ShareContent {
    const palmOil = product.palm_oil_analysis;
    const isFree = palmOil?.isPalmOilFree;
    const isNonSustainable = palmOil?.isNonSustainable;
    const status = isFree ? '🟢 Palm Oil Free' : isNonSustainable ? '🔴 Non-Sustainable Palm Oil' : '🟠 Contains Palm Oil';
    
    // VIRAL HOOK for palm oil - environmental concern
    const hook = isFree 
      ? `✅ Good news: ${productName} is palm oil free!`
      : isNonSustainable
      ? `⚠️ ${productName} contains non-sustainable palm oil`
      : `🌴 ${productName} contains palm oil - check the details`;
    
    const title = `${status}: ${productName}`;
    const message = `${hook}\n\n` +
      `🌍 Palm oil production impacts rainforests & wildlife\n` +
      `🔍 See full sustainability breakdown in TruScore\n` +
      `📱 Free app - scan any product instantly\n\n` +
      `#TruScore #PalmOil #SustainableShopping #ProductScan #Deforestation #EthicalShopping`;

    return {
      title,
      message,
      url: universalLink,
      imageUrl: product.image_url,
      hashtags: ['TruScore', 'PalmOil', 'SustainableShopping', 'ProductScan', 'Deforestation', 'EthicalShopping'],
    };
  }

  private static buildNutritionContent(
    product: ShareOptions['product'],
    universalLink: string,
    productName: string,
    platform: ShareOptions['platform']
  ): ShareContent {
    const nutriments = product.nutriments;
    const energy = nutriments?.['energy-kcal_100g'] || nutriments?.['energy-kcal'];
    const protein = nutriments?.proteins_100g || nutriments?.proteins;
    const carbs = nutriments?.carbohydrates_100g || nutriments?.carbohydrates;
    
    // VIRAL HOOK - health and nutrition focus
    const title = `🥗 Nutrition Facts: ${productName}`;
    const message = `📊 Just checked ${productName}'s nutrition:\n\n` +
      (energy ? `⚡ Energy: ${energy} kcal\n` : '') +
      (protein ? `💪 Protein: ${protein}g\n` : '') +
      (carbs ? `🍞 Carbs: ${carbs}g\n` : '') +
      `\n🔍 See complete nutrition breakdown\n` +
      `📱 Free TruScore app - scan any product\n\n` +
      `#TruScore #Nutrition #HealthyEating #ProductScan #NutritionFacts #HealthCheck`;

    return {
      title,
      message,
      url: universalLink,
      imageUrl: product.image_url,
      hashtags: ['TruScore', 'Nutrition', 'HealthyEating', 'ProductScan', 'NutritionFacts', 'HealthCheck'],
    };
  }

  private static buildIngredientsContent(
    product: ShareOptions['product'],
    universalLink: string,
    productName: string,
    platform: ShareOptions['platform']
  ): ShareContent {
    const ingredients = product.ingredients_text || 'Ingredients not available';
    const preview = ingredients.length > 200 ? ingredients.substring(0, 200) + '...' : ingredients;
    
    const title = `🧪 Ingredients: ${productName}`;
    const message = `Ingredients in ${productName}:\n\n${preview}\n\n` +
      `🔍 Tap to see full ingredients list in TruScore\n\n` +
      `#TruScore #Ingredients #ProductScan #FoodTransparency`;

    return {
      title,
      message,
      url: universalLink,
      imageUrl: product.image_url,
      hashtags: ['TruScore', 'Ingredients', 'ProductScan', 'FoodTransparency'],
    };
  }

  private static buildProcessingContent(
    product: ShareOptions['product'],
    universalLink: string,
    productName: string,
    platform: ShareOptions['platform']
  ): ShareContent {
    const novaGroup = product.nova_group;
    const novaLabels = ['Unprocessed', 'Minimally processed', 'Processed', 'Ultra-processed'];
    const novaLabel = novaGroup ? novaLabels[novaGroup - 1] || `NOVA ${novaGroup}` : 'Unknown';
    
    const title = `⚙️ Processing Level: ${productName}`;
    const message = `${productName} - ${novaLabel} (NOVA ${novaGroup || '?'})\n\n` +
      `📊 Tap to learn about processing levels in TruScore\n\n` +
      `#TruScore #NOVA #FoodProcessing #ProductScan`;

    return {
      title,
      message,
      url: universalLink,
      imageUrl: product.image_url,
      hashtags: ['TruScore', 'NOVA', 'FoodProcessing', 'ProductScan'],
    };
  }

  private static buildAllergensContent(
    product: ShareOptions['product'],
    universalLink: string,
    productName: string,
    platform: ShareOptions['platform']
  ): ShareContent {
    const allergens = product.allergens_tags || [];
    const additives = product.additives_tags || [];
    const hasAllergens = allergens.length > 0;
    const hasAdditives = additives.length > 0;
    
    const title = `⚠️ Allergens & Additives: ${productName}`;
    let message = `${productName} - `;
    
    if (hasAllergens) {
      message += `Contains allergens: ${allergens.slice(0, 3).map(tag => tag.replace(/^en:/, '')).join(', ')}\n\n`;
    }
    
    if (hasAdditives) {
      message += `Additives: ${additives.length} detected\n\n`;
    }
    
    message += `🔍 Tap to view full details in TruScore\n\n` +
      `#TruScore #Allergens #Additives #ProductScan #FoodSafety`;

    return {
      title,
      message,
      url: universalLink,
      imageUrl: product.image_url,
      hashtags: ['TruScore', 'Allergens', 'Additives', 'ProductScan', 'FoodSafety'],
    };
  }

  private static buildEcoScoreContent(
    product: ShareOptions['product'],
    universalLink: string,
    productName: string,
    platform: ShareOptions['platform']
  ): ShareContent {
    // Calculate Eco-Score from product
    const { calculateEcoScore } = require('../../../services/openFoodFacts');
    const ecoScore = calculateEcoScore(product);
    const score = ecoScore?.score || 0;
    const grade = ecoScore?.grade || (score >= 80 ? 'a' : score >= 70 ? 'b' : score >= 55 ? 'c' : score >= 40 ? 'd' : 'e');
    
    const gradeEmoji = grade === 'a' ? '🌱' : grade === 'b' ? '✅' : grade === 'c' ? '⚠️' : grade === 'd' ? '🔶' : '❌';
    const gradeLabel = grade.toUpperCase();
    
    const title = `${gradeEmoji} Eco-Score ${gradeLabel}: ${productName}`;
    const message = `${productName} - Eco-Score ${gradeLabel} (${score}/100)\n\n` +
      `🌍 Environmental impact score based on:\n` +
      (ecoScore?.co2_total ? `• CO₂: ${ecoScore.co2_total.toFixed(1)} kg CO₂e/kg\n` : '') +
      (ecoScore?.water_footprint ? `• Water: ${ecoScore.water_footprint.toFixed(0)} L/kg\n` : '') +
      `\n🔍 Tap to check full Eco-Score details in TruScore\n\n` +
      `#TruScore #EcoScore #Sustainability #EnvironmentalImpact #ProductScan`;
    
    return {
      title,
      message,
      url: universalLink,
      imageUrl: product.image_url,
      hashtags: ['TruScore', 'EcoScore', 'Sustainability', 'EnvironmentalImpact', 'ProductScan'],
    };
  }

  private static getScoreLabel(score: number): string {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  }

  /**
   * Optimize content for specific platform with viral hooks
   */
  static optimizeForPlatform(content: ShareContent, platform: ShareOptions['platform']): ShareContent {
    switch (platform) {
      case 'twitter':
        // Twitter: 280 character limit, hook in first line
        const twitterMessage = content.message.length > 280 
          ? content.message.substring(0, 250) + '...\n\n' + content.url
          : content.message + '\n\n' + content.url;
        return {
          ...content,
          message: twitterMessage.substring(0, 280),
          hashtags: content.hashtags?.slice(0, 3), // Limit hashtags for Twitter
        };
      
      case 'facebook':
        // Facebook: Storytelling, longer format, community feel
        return {
          ...content,
          message: content.message + '\n\n👥 Join 1M+ users discovering the truth about products\n📱 Free to download - no sign-up required',
        };
      
      case 'instagram':
        // Instagram: Visual-first, emoji-heavy, trending hashtags
        return {
          ...content,
          message: content.message.substring(0, 200) + '\n\n' + 
            (content.hashtags?.slice(0, 5).map(tag => `#${tag}`).join(' ') || ''),
          hashtags: content.hashtags?.slice(0, 10), // More hashtags for Instagram
        };
      
      case 'snapchat':
        // Snapchat: Very short, personal, urgent
        return {
          ...content,
          message: content.message.split('\n')[0] + '\n\n🔍 Tap to see more!',
        };
      
      case 'tiktok':
        // TikTok: Hook in first 3 seconds, trending format
        const tiktokHook = content.message.split('\n')[0];
        return {
          ...content,
          message: `${tiktokHook}\n\nPOV: You scan a product and...\n\n${content.url}\n\n` +
            (content.hashtags?.slice(0, 5).map(tag => `#${tag}`).join(' ') || ''),
        };
      
      case 'whatsapp':
        // WhatsApp: Personal, conversational, trust-building
        return {
          ...content,
          message: content.message + '\n\n💬 Thought you\'d find this interesting!',
        };
      
      default:
        return content;
    }
  }
}


