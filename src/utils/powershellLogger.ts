// PowerShell-friendly logging utility
// Formats logs for clear PowerShell console output with colors and structure

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';

interface PowerShellLogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
}

class PowerShellLogger {
  private logBuffer: PowerShellLogEntry[] = [];
  private maxBufferSize = 1000;

  /**
   * Format log entry for PowerShell with colors and structure
   */
  private formatLog(entry: PowerShellLogEntry): string {
    const timestamp = entry.timestamp;
    const level = entry.level;
    const category = entry.category;
    const message = entry.message;

    // PowerShell color codes
    const colors = {
      DEBUG: '\u001b[36m',    // Cyan
      INFO: '\u001b[34m',     // Blue
      SUCCESS: '\u001b[32m',  // Green
      WARN: '\u001b[33m',     // Yellow
      ERROR: '\u001b[31m',    // Red
      RESET: '\u001b[0m',     // Reset
      BOLD: '\u001b[1m',      // Bold
    };

    const levelColor = colors[level] || colors.INFO;
    const reset = colors.RESET;
    const bold = colors.BOLD;

    // Format: [TIMESTAMP] [LEVEL] [CATEGORY] Message
    let formatted = `${bold}[${timestamp}]${reset} ${levelColor}[${level}]${reset} ${bold}[${category}]${reset} ${message}`;

    // Add data if present
    if (entry.data) {
      formatted += `\n${this.formatData(entry.data, '  ')}`;
    }

    return formatted;
  }

  /**
   * Format data object for display
   */
  private formatData(data: any, indent: string = ''): string {
    if (typeof data === 'string') {
      return `${indent}${data}`;
    }
    if (typeof data === 'object' && data !== null) {
      if (Array.isArray(data)) {
        return data.map((item, index) => 
          `${indent}[${index}]: ${this.formatData(item, indent + '  ')}`
        ).join('\n');
      }
      return Object.entries(data)
        .map(([key, value]) => 
          `${indent}${key}: ${this.formatData(value, indent + '  ')}`
        )
        .join('\n');
    }
    return `${indent}${String(data)}`;
  }

  /**
   * Log entry (public method for external use)
   */
  log(level: LogLevel, category: string, message: string, data?: any): void {
    const entry: PowerShellLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
    };

    // Add to buffer
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }

    // Output to console with PowerShell formatting
    // Use structured format that PowerShell can parse
    const formatted = this.formatLog(entry);
    console.log(formatted);
    
    // Also output in a format that's easy to parse
    const structured = `[${level}] [${category}] ${message}`;
    console.log(structured);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  /**
   * Log database query
   */
  databaseQuery(barcode: string, database: string, status: 'start' | 'success' | 'error', data?: any): void {
    const statusMessage = status === 'start' ? 'Querying...' : 
                         status === 'success' ? '✅ Found product' : 
                         '❌ Error';
    this.log('INFO', 'DATABASE', `${database}: ${statusMessage}`, { barcode, ...data });
  }

  /**
   * Log database query result
   */
  databaseResult(barcode: string, database: string, product: any, hasData: boolean): void {
    const dataQuality = this.assessDataQuality(product);
    this.log('SUCCESS', 'DATABASE_RESULT', `${database}: ${hasData ? 'Product found' : 'No product'}`, {
      barcode,
      hasData,
      dataQuality,
      source: product?.source,
      hasNutrition: !!product?.nutriments,
      hasIngredients: !!product?.ingredients_text,
      hasImage: !!product?.image_url,
    });
  }

  /**
   * Log TruScore calculation
   */
  truScoreCalculation(product: any, result: any, breakdown: any): void {
    this.log('SUCCESS', 'TRUSCORE', `TruScore Calculated: ${result.truscore}/100`, {
      barcode: product?.barcode,
      breakdown: {
        Body: breakdown.Body,
        Planet: breakdown.Planet,
        Ethics: breakdown.Ethics,
        Open: breakdown.Open,
      },
      hasNutriScore: result.hasNutriScore,
      hasEcoScore: result.hasEcoScore,
      hasOrigin: result.hasOrigin,
    });
  }

  /**
   * Log data quality assessment
   */
  dataQuality(barcode: string, product: any, completeness: any): void {
    this.log('INFO', 'DATA_QUALITY', `Data Quality Assessment`, {
      barcode,
      completeness: completeness.overall || 0,
      nutrition: completeness.nutrition || 0,
      ingredients: completeness.ingredients || 0,
      certifications: completeness.certifications || 0,
      packaging: completeness.packaging || 0,
      quality: this.assessDataQuality(product),
    });
  }

  /**
   * Log product merge
   */
  productMerge(products: any[], merged: any, strategy: string): void {
    this.log('SUCCESS', 'MERGE', `Merged ${products.length} products`, {
      strategy,
      sources: products.map(p => p?.source).filter(Boolean),
      mergedSource: merged?.source,
      dataQuality: this.assessDataQuality(merged),
    });
  }

  /**
   * Assess data quality
   */
  private assessDataQuality(product: any): string {
    if (!product) return 'NONE';
    
    const hasNutrition = !!product.nutriments && Object.keys(product.nutriments).length > 0;
    const hasIngredients = !!product.ingredients_text && product.ingredients_text.length > 10;
    const hasImage = !!product.image_url;
    const hasCertifications = !!product.certifications && product.certifications.length > 0;
    const hasPackaging = !!product.packaging_data;
    
    const score = [hasNutrition, hasIngredients, hasImage, hasCertifications, hasPackaging]
      .filter(Boolean).length;
    
    if (score >= 4) return 'EXCELLENT';
    if (score >= 3) return 'GOOD';
    if (score >= 2) return 'FAIR';
    if (score >= 1) return 'POOR';
    return 'NONE';
  }

  /**
   * Log section separator
   */
  section(title: string): void {
    const separator = '═'.repeat(60);
    console.log(`\n${separator}`);
    console.log(`  ${title}`);
    console.log(`${separator}\n`);
  }

  /**
   * Get log buffer (for export)
   */
  getLogs(): PowerShellLogEntry[] {
    return [...this.logBuffer];
  }

  /**
   * Clear log buffer
   */
  clearLogs(): void {
    this.logBuffer = [];
  }

  /**
   * Log barcode scan initiation
   */
  scanInitiated(barcode: string, scanType: string, timestamp: number): void {
    this.section(`BARCODE SCAN INITIATED: ${barcode}`);
    this.log('INFO', 'SCAN_START', `User scanned barcode: ${barcode}`, {
      barcode,
      scanType,
      timestamp: new Date(timestamp).toISOString(),
      scanTime: timestamp,
    });
  }

  /**
   * Log database query with detailed timing and data source information
   */
  databaseQueryDetailed(
    barcode: string,
    database: string,
    status: 'start' | 'success' | 'error' | 'skipped',
    startTime?: number,
    data?: {
      found?: boolean;
      responseTime?: number;
      dataSource?: 'OFF' | 'SQLite' | 'Cache' | 'API' | 'Converted';
      requiresProductName?: boolean;
      requiresBrandName?: boolean;
      requiresParentCompany?: boolean;
      productName?: string;
      brandName?: string;
      hasNutrition?: boolean;
      hasIngredients?: boolean;
      hasImage?: boolean;
      hasNutriScore?: boolean;
      hasEcoScore?: boolean;
      hasOrigin?: boolean;
      nutrientsCount?: number;
      ingredientsLength?: number;
      source?: string;
      skipReason?: string;
      sqliteCountry?: string;
      isPremium?: boolean;
      cacheAge?: number;
    }
  ): void {
    const now = Date.now();
    const responseTime = startTime ? now - startTime : undefined;
    
    let statusMessage: string;
    let level: LogLevel = 'INFO';
    
    switch (status) {
      case 'start':
        statusMessage = `Querying ${database}...`;
        level = 'INFO';
        break;
      case 'success':
        statusMessage = `✅ ${database}: Product found`;
        level = 'SUCCESS';
        break;
      case 'error':
        statusMessage = `❌ ${database}: Error or no product found`;
        level = 'WARN';
        break;
      case 'skipped':
        statusMessage = `⏭️  ${database}: Skipped`;
        level = 'INFO';
        break;
    }
    
    const logData: any = {
      barcode,
      database,
      status,
      timestamp: new Date(now).toISOString(),
    };
    
    if (responseTime !== undefined) {
      logData.responseTime = `${responseTime}ms`;
    }
    
    if (data) {
      Object.assign(logData, data);
      if (data.responseTime !== undefined) {
        logData.responseTime = `${data.responseTime}ms`;
      }
    }
    
    this.log(level, 'DATABASE_QUERY', statusMessage, logData);
  }

  /**
   * Log data source information (SQLite, Cache, OFF, etc.)
   */
  dataSource(
    barcode: string,
    source: 'SQLite' | 'Cache' | 'OFF' | 'API' | 'Converted' | 'UserContributed',
    product: any,
    metadata?: {
      cacheAge?: number;
      sqliteCountry?: string;
      apiEndpoint?: string;
      convertedFrom?: string;
      requiresName?: boolean;
      requiresBrand?: boolean;
      requiresParent?: boolean;
      isPremium?: boolean;
    }
  ): void {
    const hasNutrition = !!product?.nutriments && Object.keys(product.nutriments).length > 0;
    const hasIngredients = !!product?.ingredients_text && product.ingredients_text.length > 0;
    const hasImage = !!product?.image_url;
    
    this.log('INFO', 'DATA_SOURCE', `Data from ${source}`, {
      barcode,
      source,
      productName: product?.product_name || 'N/A',
      hasNutrition,
      hasIngredients,
      hasImage,
      hasNutriScore: !!product?.nutriscore_grade,
      hasEcoScore: !!product?.ecoscore_grade,
      nutrientsCount: hasNutrition ? Object.keys(product.nutriments).length : 0,
      ingredientsLength: product?.ingredients_text?.length || 0,
      ...metadata,
    });
  }

  /**
   * Log merge operation with detailed before/after comparison
   */
  mergeDetailed(
    barcode: string,
    productsBefore: any[],
    productAfter: any,
    strategy: string,
    mergeTime?: number
  ): void {
    this.section(`DATA MERGE: ${barcode}`);
    
    this.log('INFO', 'MERGE_START', `Merging ${productsBefore.length} products using ${strategy}`, {
      barcode,
      productCount: productsBefore.length,
      strategy,
      sources: productsBefore.map(p => p?.source).filter(Boolean),
    });
    
    // Calculate aggregate "before" metrics
    const beforeMetrics = {
      totalNutrients: 0,
      maxIngredientsLength: 0,
      hasNutrition: false,
      hasIngredients: false,
      hasImage: false,
      hasNutriScore: false,
      hasEcoScore: false,
      sources: [] as string[],
    };
    
    // Log each source product with detailed metrics
    productsBefore.forEach((product, index) => {
      const nutrientsCount = product?.nutriments ? Object.keys(product.nutriments).length : 0;
      const ingredientsLength = product?.ingredients_text?.length || 0;
      const hasNutrition = !!product?.nutriments && nutrientsCount > 0;
      const hasIngredients = !!product?.ingredients_text && ingredientsLength > 0;
      
      // Update aggregate metrics
      beforeMetrics.totalNutrients += nutrientsCount;
      beforeMetrics.maxIngredientsLength = Math.max(beforeMetrics.maxIngredientsLength, ingredientsLength);
      beforeMetrics.hasNutrition = beforeMetrics.hasNutrition || hasNutrition;
      beforeMetrics.hasIngredients = beforeMetrics.hasIngredients || hasIngredients;
      beforeMetrics.hasImage = beforeMetrics.hasImage || !!product?.image_url;
      beforeMetrics.hasNutriScore = beforeMetrics.hasNutriScore || !!product?.nutriscore_grade;
      beforeMetrics.hasEcoScore = beforeMetrics.hasEcoScore || !!product?.ecoscore_grade;
      if (product?.source) beforeMetrics.sources.push(product.source);
      
      this.log('INFO', 'MERGE_SOURCE', `Source ${index + 1}: ${product?.source || 'unknown'}`, {
        source: product?.source,
        hasNutrition,
        hasIngredients,
        hasImage: !!product?.image_url,
        hasNutriScore: !!product?.nutriscore_grade,
        hasEcoScore: !!product?.ecoscore_grade,
        nutrientsCount,
        ingredientsLength,
        imageUrl: product?.image_url || 'NONE',
        productName: product?.product_name || 'NONE',
      });
    });
    
    // Log "BEFORE MERGE" summary
    this.log('INFO', 'MERGE_BEFORE', `BEFORE MERGE - Aggregate metrics from ${productsBefore.length} sources`, {
      barcode,
      sourceCount: productsBefore.length,
      totalNutrients: beforeMetrics.totalNutrients,
      maxIngredientsLength: beforeMetrics.maxIngredientsLength,
      hasNutrition: beforeMetrics.hasNutrition,
      hasIngredients: beforeMetrics.hasIngredients,
      hasImage: beforeMetrics.hasImage,
      hasNutriScore: beforeMetrics.hasNutriScore,
      hasEcoScore: beforeMetrics.hasEcoScore,
      sources: beforeMetrics.sources,
    });
    
    // Log merged result with "AFTER MERGE" comparison
    const mergedHasNutrition = !!productAfter?.nutriments && Object.keys(productAfter.nutriments).length > 0;
    const mergedNutrientsCount = mergedHasNutrition ? Object.keys(productAfter.nutriments).length : 0;
    const mergedIngredientsLength = productAfter?.ingredients_text?.length || 0;
    
    // Calculate improvements
    const nutrientsAdded = mergedNutrientsCount > 0 ? mergedNutrientsCount - Math.max(...productsBefore.map(p => p?.nutriments ? Object.keys(p.nutriments).length : 0)) : 0;
    const ingredientsImproved = mergedIngredientsLength > beforeMetrics.maxIngredientsLength;
    
    this.log('SUCCESS', 'MERGE_COMPLETE', `AFTER MERGE - Merged product created`, {
      barcode,
      mergedSource: productAfter?.source,
      hasNutrition: mergedHasNutrition,
      hasIngredients: !!productAfter?.ingredients_text,
      hasImage: !!productAfter?.image_url,
      hasNutriScore: !!productAfter?.nutriscore_grade,
      hasEcoScore: !!productAfter?.ecoscore_grade,
      nutrientsCount: mergedNutrientsCount,
      ingredientsLength: mergedIngredientsLength,
      nutrientsAdded: nutrientsAdded > 0 ? `+${nutrientsAdded}` : nutrientsAdded < 0 ? `${nutrientsAdded}` : '0',
      ingredientsImproved: ingredientsImproved ? `+${mergedIngredientsLength - beforeMetrics.maxIngredientsLength} chars` : 'no change',
      mergeTime: mergeTime ? `${mergeTime}ms` : undefined,
      comparison: {
        before: {
          nutrients: beforeMetrics.totalNutrients,
          ingredientsLength: beforeMetrics.maxIngredientsLength,
          sources: beforeMetrics.sources.length,
        },
        after: {
          nutrients: mergedNutrientsCount,
          ingredientsLength: mergedIngredientsLength,
          sources: 1,
        },
      },
    });
  }

  /**
   * Log pillar calculation with detailed adjustments
   */
  pillarCalculation(
    barcode: string,
    pillar: 'Body' | 'Planet' | 'Ethics' | 'Open',
    baseScore: number,
    finalScore: number,
    adjustments: Array<{
      description: string;
      value: number;
      type: 'positive' | 'negative' | 'neutral';
      dataSource?: string;
    }>,
    details?: any,
    calculationTime?: number
  ): void {
    this.section(`${pillar.toUpperCase()} PILLAR: ${barcode}`);
    
    this.log('INFO', 'PILLAR_START', `${pillar} Pillar calculation`, {
      barcode,
      pillar,
      baseScore,
    });
    
    // Log each adjustment
    adjustments.forEach((adjustment, index) => {
      const level: LogLevel = adjustment.type === 'positive' ? 'SUCCESS' : 
                             adjustment.type === 'negative' ? 'WARN' : 'INFO';
      this.log(level, 'PILLAR_ADJUSTMENT', `${adjustment.description}: ${adjustment.value > 0 ? '+' : ''}${adjustment.value}`, {
        barcode,
        pillar,
        adjustmentIndex: index + 1,
        description: adjustment.description,
        value: adjustment.value,
        type: adjustment.type,
        dataSource: adjustment.dataSource,
      });
    });
    
    // Log final score
    this.log('SUCCESS', 'PILLAR_COMPLETE', `${pillar} Pillar: ${finalScore}/25 (base: ${baseScore})`, {
      barcode,
      pillar,
      baseScore,
      finalScore,
      totalAdjustments: adjustments.reduce((sum, adj) => sum + adj.value, 0),
      adjustmentCount: adjustments.length,
      calculationTime: calculationTime ? `${calculationTime}ms` : undefined,
      details,
    });
  }

  /**
   * Log TruScore calculation with comprehensive breakdown
   */
  truScoreCalculationDetailed(
    barcode: string,
    totalScore: number,
    breakdown: {
      Body: number;
      Planet: number;
      Ethics: number;
      Open: number;
    },
    metadata: {
      hasNutriScore?: boolean;
      hasEcoScore?: boolean;
      hasOrigin?: boolean;
      calculationTime?: number;
      totalTime?: number;
    },
    pillarDetails?: {
      body?: any;
      planet?: any;
      ethics?: any;
      open?: any;
    }
  ): void {
    this.section(`TRUSCORE CALCULATION: ${barcode}`);
    
    this.log('SUCCESS', 'TRUSCORE_COMPLETE', `TruScore: ${totalScore}/100`, {
      barcode,
      totalScore,
      breakdown,
      metadata,
      pillarDetails,
      calculationTime: metadata.calculationTime ? `${metadata.calculationTime}ms` : undefined,
      totalTime: metadata.totalTime ? `${metadata.totalTime}ms` : undefined,
    });
    
    // Log each pillar score separately
    Object.entries(breakdown).forEach(([pillar, score]) => {
      this.log('INFO', 'TRUSCORE_PILLAR', `${pillar}: ${score}/25`, {
        barcode,
        pillar,
        score,
        percentage: (score / 25) * 100,
      });
    });
  }

  /**
   * Log database query order and strategy
   */
  queryStrategy(barcode: string, strategy: string, databases: string[], order: number[], userCountry?: string | null): void {
    this.section(`DATABASE QUERY STRATEGY: ${barcode}`);
    
    this.log('INFO', 'QUERY_STRATEGY', `Query Strategy: ${strategy}`, {
      barcode,
      strategy,
      userCountry: userCountry || 'Global',
      databaseCount: databases.length,
      databases,
      queryOrder: order,
    });
    
    // Log strategy phases
    this.log('INFO', 'QUERY_PHASES', 'Query Phases:', {
      barcode,
      phase1: 'Fast Sources (OFF, Cache, SQLite) - Target: <2s',
      phase2: 'Enhancement Sources (GS1, Spoonacular, etc.) - Background',
      phase3: 'Fallback Sources (if needed)',
      strategy: 'All queries run in parallel - no blocking timeouts',
    });
    
    // Log each database in order
    databases.forEach((database, index) => {
      const orderNum = order[index] !== undefined ? order[index] : index + 1;
      this.log('INFO', 'QUERY_ORDER', `${orderNum}. ${database}`, {
        barcode,
        database,
        order: orderNum,
        position: index + 1,
      });
    });
  }
  
  /**
   * Log full TruScore analysis (fetch trace + per-pillar breakdown) for app testing.
   * Call after score is calculated so logs match exactly what the app shows.
   */
  truScoreAnalysis(analysis: {
    barcode: string;
    totalScore: number;
    fetchTrace: Array<{ database: string; queryKeyType: string; order: number; hit: boolean; responseTimeMs?: number }>;
    pillars: Record<string, { pillarName: string; baseScore: number; finalScore: number; adjustments: Array<{ description: string; value: number; type: string; sourceDatabase?: string; queryKeyType?: string }> }>;
  }): void {
    this.section(`TRUSCORE ANALYSIS: ${analysis.barcode}`);
    this.log('INFO', 'ANALYSIS_TOTAL', `TruScore: ${analysis.totalScore}/100`, {
      barcode: analysis.barcode,
      totalScore: analysis.totalScore,
    });
    this.log('INFO', 'ANALYSIS_FETCH_TRACE', `Data sources queried (order, hit/miss)`, {
      barcode: analysis.barcode,
      queryCount: analysis.fetchTrace.length,
      trace: analysis.fetchTrace.map(e => `${e.order}. ${e.database} (${e.queryKeyType}): ${e.hit ? 'HIT' : 'MISS'}`),
    });
    Object.entries(analysis.pillars).forEach(([key, pillar]) => {
      this.log('INFO', 'ANALYSIS_PILLAR', `${pillar.pillarName}: ${pillar.finalScore}/25 (base ${pillar.baseScore})`, {
        barcode: analysis.barcode,
        pillar: pillar.pillarName,
        baseScore: pillar.baseScore,
        finalScore: pillar.finalScore,
        adjustments: pillar.adjustments.map(a => ({
          desc: a.description,
          value: a.value,
          source: a.sourceDatabase,
          queryType: a.queryKeyType,
        })),
      });
    });
    console.log('[TRUSCORE_ANALYSIS_JSON] ' + JSON.stringify(analysis, null, 2));
  }

  /**
   * Log query phase indicator
   */
  queryPhase(barcode: string, phase: 1 | 2 | 3, description: string, targetTime?: string): void {
    this.log('INFO', 'QUERY_PHASE', `══════════════════════════════════════════════════════════════`, {
      barcode,
      phase: `PHASE ${phase}`,
      description,
      targetTime,
    });
    this.log('INFO', 'QUERY_PHASE_START', `📊 PHASE ${phase}: ${description}`, {
      barcode,
      phase,
      description,
      targetTime,
    });
  }
  
  /**
   * Log database conversion requirement
   */
  databaseConversion(
    barcode: string,
    database: string,
    conversionType: 'product_name' | 'brand_name' | 'parent_company',
    originalValue?: string,
    convertedValue?: string,
    source?: string
  ): void {
    this.log('INFO', 'DATABASE_CONVERSION', `Database ${database} requires ${conversionType}`, {
      barcode,
      database,
      conversionType,
      originalValue: originalValue || 'N/A',
      convertedValue: convertedValue || 'N/A',
      source: source || 'unknown',
      requiresConversion: true,
    });
  }

  /**
   * Log database skipped with reason
   */
  databaseSkipped(barcode: string, database: string, reason: string): void {
    this.log('INFO', 'DATABASE_SKIPPED', `⏭️  ${database}: Skipped - ${reason}`, {
      barcode,
      database,
      reason,
    });
  }
  
  /**
   * Log process completion summary with timing breakdown
   */
  processComplete(
    barcode: string,
    totalTime: number,
    breakdown: {
      databaseQueries?: number;
      dataMerging?: number;
      truScoreCalculation?: number;
      uiRendering?: number;
      enhancements?: number;
      [key: string]: number | undefined;
    },
    finalTruScore?: number | null,
    finalSource?: string
  ): void {
    this.section(`PROCESS COMPLETE: ${barcode}`);
    
    // Calculate time breakdown
    const knownTimes = Object.values(breakdown).filter((v): v is number => typeof v === 'number');
    const knownTotal = knownTimes.reduce((sum, time) => sum + time, 0);
    const otherTime = totalTime - knownTotal;
    
    this.log('SUCCESS', 'PROCESS_COMPLETE', `Total time from scan to display: ${totalTime}ms`, {
      barcode,
      totalTime,
      breakdown: {
        databaseQueries: breakdown.databaseQueries ? `${breakdown.databaseQueries}ms` : 'N/A',
        dataMerging: breakdown.dataMerging ? `${breakdown.dataMerging}ms` : 'N/A',
        truScoreCalculation: breakdown.truScoreCalculation ? `${breakdown.truScoreCalculation}ms` : 'N/A',
        enhancements: breakdown.enhancements ? `${breakdown.enhancements}ms` : 'N/A',
        uiRendering: breakdown.uiRendering ? `${breakdown.uiRendering}ms` : 'N/A',
        other: otherTime > 0 ? `${otherTime}ms` : '0ms',
      },
      finalTruScore: finalTruScore || null,
      finalSource: finalSource || 'unknown',
      performance: {
        excellent: totalTime < 2000,
        good: totalTime < 5000,
        acceptable: totalTime < 10000,
        slow: totalTime >= 10000,
      },
    });
  }
  
  /**
   * Log performance metrics summary
   */
  performanceMetrics(
    barcode: string,
    metrics: {
      totalTime: number;
      databaseQueries: number;
      databasesQueried: number;
      databasesFound: number;
      databasesSkipped: number;
      productsMerged: number;
      truScore: number;
      cacheHit?: boolean;
      sqliteHit?: boolean;
    }
  ): void {
    this.section(`PERFORMANCE METRICS: ${barcode}`);
    
    const successRate = metrics.databasesQueried > 0 
      ? ((metrics.databasesFound / metrics.databasesQueried) * 100).toFixed(1)
      : '0';
    
    this.log('INFO', 'PERFORMANCE_SUMMARY', `Performance Metrics Summary`, {
      barcode,
      totalTime: `${metrics.totalTime}ms`,
      databaseQueries: {
        queried: metrics.databasesQueried,
        found: metrics.databasesFound,
        skipped: metrics.databasesSkipped,
        successRate: `${successRate}%`,
      },
      caching: {
        cacheHit: metrics.cacheHit || false,
        sqliteHit: metrics.sqliteHit || false,
        cacheSource: metrics.cacheHit ? 'AsyncStorage Cache' : metrics.sqliteHit ? 'SQLite' : 'No Cache',
      },
      merging: {
        productsMerged: metrics.productsMerged,
      },
      truScore: {
        score: metrics.truScore,
        calculated: metrics.truScore > 0,
      },
      performance: {
        rating: metrics.totalTime < 2000 ? 'EXCELLENT' : 
                metrics.totalTime < 5000 ? 'GOOD' : 
                metrics.totalTime < 10000 ? 'ACCEPTABLE' : 'SLOW',
        timeToDisplay: metrics.totalTime,
      },
    });
  }

  /**
   * Log final product data sources - shows which databases contributed each field
   */
  finalProductSources(
    barcode: string,
    fieldSources: Record<string, {
      source: string | string[];
      method?: string;
      details?: string;
      weight?: number;
    }>
  ): void {
    this.section(`FINAL PRODUCT DATA SOURCES: ${barcode}`);
    
    const sourceMap: Record<string, any> = {};
    Object.entries(fieldSources).forEach(([field, info]) => {
      const sources = Array.isArray(info.source) ? info.source : [info.source];
      const sourceList = sources.length > 1 
        ? sources.map((s, i) => `${s}${info.weight !== undefined && info.weight < 1 ? ` (${(info.weight * 100).toFixed(0)}%)` : ''}`).join(' + ')
        : sources[0];
      
      sourceMap[field] = {
        source: sourceList,
        method: info.method || (sources.length > 1 ? 'merged' : 'single'),
        details: info.details,
      };
    });
    
    this.log('INFO', 'FINAL_PRODUCT_SOURCES', `Final Product Data Sources`, {
      barcode,
      fieldSources: sourceMap,
      totalFields: Object.keys(fieldSources).length,
      uniqueSources: Array.from(new Set(Object.values(fieldSources).flatMap(i => Array.isArray(i.source) ? i.source : [i.source]))).length,
    });
  }

  /**
   * Log field-level source mapping with detailed attribution
   */
  fieldSourceMapping(
    barcode: string,
    mapping: Record<string, {
      primarySource: string;
      allSources?: Array<{ source: string; weight?: number; provided?: string }>;
      mergeMethod?: 'single' | 'weighted_average' | 'longest' | 'union' | 'best_quality';
      reason?: string;
    }>
  ): void {
    this.section(`FIELD SOURCE MAPPING: ${barcode}`);
    
    const fieldMappings: Record<string, any> = {};
    Object.entries(mapping).forEach(([field, info]) => {
      fieldMappings[field] = {
        primarySource: info.primarySource,
        mergeMethod: info.mergeMethod || 'single',
        reason: info.reason,
        allSources: info.allSources?.map(s => ({
          source: s.source,
          weight: s.weight ? `${(s.weight * 100).toFixed(0)}%` : undefined,
          provided: s.provided,
        })),
      };
    });
    
    this.log('INFO', 'FIELD_SOURCE_MAPPING', `Field-Level Source Mapping`, {
      barcode,
      mapping: fieldMappings,
      totalFields: Object.keys(mapping).length,
    });
  }

  /**
   * Log progressive display summary - what fields were available at each update
   */
  progressiveDisplaySummary(
    barcode: string,
    updates: Array<{
      phase: string;
      timestamp: number;
      timeFromStart: number;
      availableFields: string[];
      missingFields?: string[];
      source: string;
      productComplete: boolean;
    }>
  ): void {
    this.section(`PROGRESSIVE DISPLAY SUMMARY: ${barcode}`);
    
    const summary = updates.map(update => ({
      phase: update.phase,
      timestamp: new Date(update.timestamp).toISOString(),
      timeFromStart: `${update.timeFromStart}ms`,
      source: update.source,
      availableFields: update.availableFields,
      availableFieldsCount: update.availableFields.length,
      missingFields: update.missingFields || [],
      missingFieldsCount: update.missingFields?.length || 0,
      productComplete: update.productComplete,
    }));
    
    this.log('INFO', 'PROGRESSIVE_DISPLAY_SUMMARY', `Progressive Display Summary`, {
      barcode,
      updates: summary,
      totalUpdates: updates.length,
      finalFieldsCount: updates[updates.length - 1]?.availableFields.length || 0,
    });
  }
}

export const powershellLogger = new PowerShellLogger();



