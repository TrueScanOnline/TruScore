// Share content builder
// Creates platform-optimized content for sharing
// Uses universal links that open the app directly or redirect to app stores

import { ShareContent, ShareOptions } from '../types';
import { buildShareUrl } from '../../../utils/shareUrl';
import { logger } from '../../../utils/logger';
import { extractManufacturingCountry, calculateEcoScore } from '../../../services/openFoodFacts';
import { getNutritionShareBurnData, buildNutritionShareBodyLines } from '../../../utils/nutritionShareCopy';
import { productIdentity } from '../../../config/productIdentity';
import {
  resolveShareOverallScore,
  resolveShareBreakdownForOverall,
} from '../../../utils/shareScoreSemantics';
import {
  RVEEL_SCORE_UNAVAILABLE_EXPLANATION,
  RVEEL_SCORE_UNAVAILABLE_TITLE,
} from '../../../utils/truScorePresentation';

const scoreName = productIdentity.publicScoreName;
const appName = productIdentity.displayName;

export class ShareContentBuilder {
  /**
   * Build share content based on item type and platform
   * All share content now uses universal links that open the app directly
   * or redirect to app stores if the app is not installed
   */
  static buildContent(options: ShareOptions): ShareContent {
    const { product, truScore, item, platform = 'native' } = options;
    const universalLink = buildShareUrl(product.barcode, {
      context: item,
      source:
        platform && platform !== 'native' && platform !== 'moreApps' ? platform : undefined,
      utmSource: 'app',
      utmMedium: 'share',
      utmCampaign: item,
    });
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
    const score = resolveShareOverallScore(truScore, product);
    const breakdown = resolveShareBreakdownForOverall(score, truScore, product);

    if (score === null) {
      const title = `${productName} - ${RVEEL_SCORE_UNAVAILABLE_TITLE}`;
      const message =
        `${productName}\n\n` +
        `${RVEEL_SCORE_UNAVAILABLE_TITLE}\n` +
        `${RVEEL_SCORE_UNAVAILABLE_EXPLANATION}\n\n` +
        `🔍 Tap to open in ${appName}\n` +
        `📱 Free app - no sign-up needed\n\n` +
        `#RveelScore #ProductScan #${appName} #FoodTransparency #KnowWhatYouBuy`;
      return {
        title,
        message,
        url: universalLink,
        imageUrl: product.image_url,
        hashtags: ['RveelScore', 'ProductScan', appName, 'FoodTransparency', 'KnowWhatYouBuy'],
      };
    }

    // VIRAL HOOKS - Platform-optimized for maximum engagement
    const emoji = score >= 80 ? '🌟' : score >= 60 ? '✅' : score >= 40 ? '⚠️' : '❌';
    
    // Score-based viral hooks
    let hook: string;
    let curiosityGap: string;
    
    if (score >= 80) {
      hook = `🌟 ${productName}`;
      curiosityGap = `Strong ${scoreName} (${score}/100) — open the app for the four-pillar breakdown (Body, Planet, Ethics, Open).`;
    } else if (score >= 60) {
      hook = `✅ Scanned ${productName}`;
      curiosityGap = `${scoreName} ${score}/100 — see nutrition, planet, ethics & transparency details in ${appName}.`;
    } else if (score >= 40) {
      hook = `⚠️ ${productName}`;
      curiosityGap = `${scoreName} ${score}/100 — review what drove the score in the app before you buy.`;
    } else {
      hook = `📊 ${productName}`;
      curiosityGap = `Lower ${scoreName} (${score}/100) — check the breakdown; scores are informational from public data.`;
    }

    const title = `${emoji} ${productName} - ${scoreName} ${score}/100`;
    let message = `${hook}\n\n${curiosityGap}\n\n` +
      `📊 ${scoreName}: ${score}/100\n`;
    if (breakdown) {
      message +=
        `• Body: ${breakdown.Body}/25\n` +
        `• Planet: ${breakdown.Planet}/25\n` +
        `• Ethics: ${breakdown.Ethics}/25\n` +
        `• Open: ${breakdown.Open}/25\n`;
    }
    message +=
      `\n🔍 Tap to see the full breakdown\n` +
      `📱 Free app - no sign-up needed\n\n` +
      `#RveelScore #ProductScan #${appName} #FoodTransparency #KnowWhatYouBuy`;

    return {
      title,
      message,
      url: universalLink,
      imageUrl: product.image_url,
      hashtags: ['RveelScore', 'ProductScan', appName, 'FoodTransparency', 'KnowWhatYouBuy'],
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
      `📱 Free ${appName} app - scan any product for recalls\n\n` +
      `#FoodRecall #ProductSafety #RveelScore #FoodSafetyAlert #RecallAlert`;

    return {
      title,
      message,
      url: universalLink,
      hashtags: ['FoodRecall', 'ProductSafety', 'RveelScore', 'FoodSafetyAlert', 'RecallAlert'],
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
      `🔍 Tap to view full details in ${appName}`;

    return {
      title,
      message,
      url: universalLink,
      hashtags: ['CountryOfOrigin', 'Manufacturing', 'RveelScore'],
    };
  }

  private static buildNegativeTruScoreContent(
    product: ShareOptions['product'],
    truScore: ShareOptions['truScore'],
    universalLink: string,
    productName: string,
    platform: ShareOptions['platform']
  ): ShareContent {
    const score = resolveShareOverallScore(truScore, product);

    if (score === null) {
      const title = `${productName}: ${RVEEL_SCORE_UNAVAILABLE_TITLE}`;
      const message =
        `${title}\n\n` +
        `${RVEEL_SCORE_UNAVAILABLE_EXPLANATION}\n\n` +
        `🔍 Tap to view details in ${appName}`;
      return {
        title,
        message,
        url: universalLink,
        hashtags: ['RveelScore', 'ProductAlert'],
      };
    }

    const title = `⚠️ Low ${scoreName} alert: ${productName}`;
    const message = `${title}\n\n` +
      `${scoreName}: ${score}/100\n\n` +
      `This product has a low ${scoreName}. Check the details to understand why.\n\n` +
      `🔍 Tap to view breakdown in ${appName}`;

    return {
      title,
      message,
      url: universalLink,
      hashtags: ['LowRveelScore', 'ProductAlert', 'RveelScore'],
    };
  }

  private static buildProductInfoContent(
    product: ShareOptions['product'],
    truScore: ShareOptions['truScore'],
    universalLink: string,
    productName: string,
    platform: ShareOptions['platform']
  ): ShareContent {
    const score = resolveShareOverallScore(truScore, product);

    // Preserve existing product-info share shape; omit numeric score when unavailable
    // (do not invent a separate product-only unavailable share experience).
    if (score === null) {
      const title = `Discovered ${productName} on ${appName}`;
      const message =
        `🔍 Just scanned ${productName}!\n\n` +
        `See nutrition, ingredients, sustainability & more\n` +
        `📱 Free app - scan any product instantly\n\n` +
        `#RveelScore #ProductScan #${appName} #KnowWhatYouBuy #ProductDiscovery`;
      return {
        title,
        message,
        url: universalLink,
        imageUrl: product.image_url,
        hashtags: ['RveelScore', 'ProductScan', appName, 'KnowWhatYouBuy', 'ProductDiscovery'],
      };
    }

    const emoji = score >= 80 ? '🌟' : score >= 60 ? '✅' : score >= 40 ? '⚠️' : '❌';

    // VIRAL HOOK - curiosity and discovery
    const title = `${emoji} Discovered ${productName} on ${appName}`;
    const message = `🔍 Just scanned ${productName}!\n\n` +
      `${scoreName}: ${score}/100\n\n` +
      `See nutrition, ingredients, sustainability & more\n` +
      `📱 Free app - scan any product instantly\n\n` +
      `#RveelScore #ProductScan #${appName} #KnowWhatYouBuy #ProductDiscovery`;

    return {
      title,
      message,
      url: universalLink,
      imageUrl: product.image_url,
      hashtags: ['RveelScore', 'ProductScan', appName, 'KnowWhatYouBuy', 'ProductDiscovery'],
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
        : `Check out the insights in ${appName}!\n\n`) +
      `🔍 Tap to view insights in ${appName}\n\n` +
      `#RveelScore #FoodInsights #ProductScan`;

    return {
      title,
      message,
      url: universalLink,
      imageUrl: product.image_url,
      hashtags: ['RveelScore', 'FoodInsights', 'ProductScan'],
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
      `🔍 See full sustainability breakdown in ${appName}\n` +
      `📱 Free app - scan any product instantly\n\n` +
      `#RveelScore #PalmOil #Sustainability #ProductScan #Deforestation`;

    return {
      title,
      message,
      url: universalLink,
      imageUrl: product.image_url,
      hashtags: ['RveelScore', 'PalmOil', 'Sustainability', 'ProductScan', 'Deforestation'],
    };
  }

  private static buildNutritionContent(
    product: ShareOptions['product'],
    universalLink: string,
    productName: string,
    platform: ShareOptions['platform']
  ): ShareContent {
    const { kcalPer100g, burn } = getNutritionShareBurnData(product.nutriments);
    const title = `🥗 Nutrition: ${productName}`;
    const message = buildNutritionShareBodyLines({
      productName,
      universalLink,
      kcalPer100g,
      burn,
    });

    return {
      title,
      message,
      url: universalLink,
      imageUrl: product.image_url,
      hashtags: ['RveelScore', 'Nutrition', 'ProductScan'],
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
      `🔍 Tap to see full ingredients list in ${appName}\n\n` +
      `#RveelScore #Ingredients #ProductScan #FoodTransparency`;

    return {
      title,
      message,
      url: universalLink,
      imageUrl: product.image_url,
      hashtags: ['RveelScore', 'Ingredients', 'ProductScan', 'FoodTransparency'],
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
      `📊 Tap to learn about processing levels in ${appName}\n\n` +
      `#RveelScore #NOVA #FoodProcessing #ProductScan`;

    return {
      title,
      message,
      url: universalLink,
      imageUrl: product.image_url,
      hashtags: ['RveelScore', 'NOVA', 'FoodProcessing', 'ProductScan'],
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
    
    message += `🔍 Tap to view full details in ${appName}\n\n` +
      `#RveelScore #Allergens #Additives #ProductScan #FoodSafety`;

    return {
      title,
      message,
      url: universalLink,
      imageUrl: product.image_url,
      hashtags: ['RveelScore', 'Allergens', 'Additives', 'ProductScan', 'FoodSafety'],
    };
  }

  private static buildEcoScoreContent(
    product: ShareOptions['product'],
    universalLink: string,
    productName: string,
    platform: ShareOptions['platform']
  ): ShareContent {
    // Calculate Eco-Score from product
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
      `\n🔍 Tap to check full Eco-Score details in ${appName}\n\n` +
      `#RveelScore #EcoScore #Sustainability #EnvironmentalImpact #ProductScan`;
    
    return {
      title,
      message,
      url: universalLink,
      imageUrl: product.image_url,
      hashtags: ['RveelScore', 'EcoScore', 'Sustainability', 'EnvironmentalImpact', 'ProductScan'],
    };
  }

  /**
   * Optimize content for specific platform with viral hooks
   */
  static optimizeForPlatform(content: ShareContent, platform: ShareOptions['platform']): ShareContent {
    switch (platform) {
      case 'twitter': {
        let text = content.message;
        if (content.url) {
          text = text.split(content.url).join('').replace(/\n{3,}/g, '\n\n').trim();
        }
        const max = 220;
        if (text.length > max) {
          text = `${text.substring(0, max - 1)}…`;
        }
        return {
          ...content,
          message: text,
          hashtags: content.hashtags?.slice(0, 3),
        };
      }
      
      case 'facebook':
        return {
          ...content,
          message:
            content.message +
            '\n\n📱 Free to download — see the full story when you open the link.',
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


