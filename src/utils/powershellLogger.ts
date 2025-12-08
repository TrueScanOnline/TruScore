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
        Care: breakdown.Care,
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
   * Log parallel query phase
   */
  queryPhase(phase: string, databases: string[], results: any[]): void {
    this.log('INFO', 'QUERY_PHASE', `Phase: ${phase}`, {
      databases,
      resultsFound: results.length,
      sources: results.map(r => r?.source).filter(Boolean),
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
}

export const powershellLogger = new PowerShellLogger();


