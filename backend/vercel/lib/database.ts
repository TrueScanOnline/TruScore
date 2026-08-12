/**
 * Database Service for Vercel Backend
 * Provides database abstraction layer for persistent storage
 * 
 * Supports:
 * - Neon Postgres (recommended - via pg library)
 * - Supabase Postgres (via pg library)
 * - Vercel Postgres (via @vercel/postgres)
 * - MongoDB Atlas (alternative)
 * - In-memory fallback (development only)
 */

// Database connection (lazy-loaded)
let db: any = null;

/**
 * Get Postgres connection URL from environment variables
 * Checks both DATABASE_URL (Neon) and POSTGRES_URL (Supabase/Vercel)
 */
function getPostgresUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL;
}

/**
 * Initialize database connection
 * Automatically detects available database type
 */
async function initDatabase(): Promise<any> {
  if (db) {
    return db;
  }

  // Try Postgres (Neon, Supabase, or Vercel Postgres)
  // Neon uses DATABASE_URL, others may use POSTGRES_URL
  const postgresUrl = getPostgresUrl();
  if (postgresUrl) {
    try {
      // Use pg library for direct connection (works with Neon, Supabase, etc.)
      const { Pool } = await import('pg');
      db = new Pool({
        connectionString: postgresUrl,
        ssl: postgresUrl.includes('sslmode=require') 
          ? { rejectUnauthorized: false } 
          : undefined,
        max: 20,
        idleTimeoutMillis: 30000,
        // Serverless cold starts (Neon/Supabase) often exceed 2s — avoid failing GETs prematurely
        connectionTimeoutMillis: 10000,
      });
      
      // Test connection
      await db.query('SELECT NOW()');
      console.log('[Database] ✅ Connected to Postgres (Neon/Supabase)');
      await createTables();
      return db;
    } catch (error) {
      console.warn('[Database] Postgres connection failed:', error);
      // Try @vercel/postgres as fallback
      try {
        const { createClient } = await import('@vercel/postgres');
        db = createClient();
        console.log('[Database] ✅ Connected to Postgres via @vercel/postgres');
        await createTables();
        return db;
      } catch (vercelError) {
        console.warn('[Database] @vercel/postgres also failed:', vercelError);
      }
    }
  }

  // Try MongoDB Atlas (alternative)
  if (process.env.MONGODB_URI) {
    try {
      const { MongoClient } = await import('mongodb');
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      db = client.db('truescan');
      console.log('[Database] ✅ Connected to MongoDB Atlas');
      await createTables();
      return db;
    } catch (error) {
      console.warn('[Database] MongoDB not available:', error);
    }
  }

  // Fallback to in-memory (development only)
  console.warn('[Database] ⚠️  No database configured, using in-memory storage (data will be lost on restart)');
  console.warn('[Database] Configure POSTGRES_URL or MONGODB_URI for persistent storage');
  db = new Map();
  return db;
}

/**
 * Create database tables/schemas
 */
async function createTables(): Promise<void> {
  try {
    const postgresUrl = getPostgresUrl();
    if (postgresUrl && db) {
      // Use direct pg queries (works with Neon, Supabase, etc.)
      await Promise.all([
        db.query(`
        CREATE TABLE IF NOT EXISTS manufacturing_country_submissions (
          id SERIAL PRIMARY KEY,
          barcode VARCHAR(20) NOT NULL,
          country VARCHAR(100) NOT NULL,
          user_id VARCHAR(255) NOT NULL,
          timestamp BIGINT NOT NULL,
          verified BOOLEAN DEFAULT FALSE,
          verified_count INTEGER DEFAULT 1,
          disputed BOOLEAN DEFAULT FALSE,
          photo_url TEXT,
          has_imported_ingredients BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(barcode, user_id)
        )
      `),
        db.query(`
        CREATE TABLE IF NOT EXISTS manual_products (
          id SERIAL PRIMARY KEY,
          barcode VARCHAR(20) UNIQUE NOT NULL,
          product_data JSONB NOT NULL,
          submitted_at BIGINT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `),
        db.query(`
        CREATE TABLE IF NOT EXISTS user_prices (
          id SERIAL PRIMARY KEY,
          barcode VARCHAR(20) NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          currency VARCHAR(3) NOT NULL,
          retailer VARCHAR(255) NOT NULL,
          location VARCHAR(255),
          user_id VARCHAR(255) NOT NULL,
          timestamp BIGINT NOT NULL,
          verified BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `),
        db.query(`
        CREATE TABLE IF NOT EXISTS photos (
          id SERIAL PRIMARY KEY,
          barcode VARCHAR(20) NOT NULL,
          image_type VARCHAR(50) NOT NULL,
          photo_url TEXT NOT NULL,
          photo_data TEXT,
          user_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT NOW()
        )
      `),
      ]);

      await Promise.all([
        db.query(`
        CREATE INDEX IF NOT EXISTS idx_manufacturing_country_barcode 
        ON manufacturing_country_submissions(barcode)
      `),
        db.query(`
        CREATE INDEX IF NOT EXISTS idx_manufacturing_country_user 
        ON manufacturing_country_submissions(user_id)
      `),
        db.query(`
        CREATE INDEX IF NOT EXISTS idx_manual_products_barcode 
        ON manual_products(barcode)
      `),
        db.query(`
        CREATE INDEX IF NOT EXISTS idx_user_prices_barcode 
        ON user_prices(barcode)
      `),
        db.query(`
        CREATE INDEX IF NOT EXISTS idx_user_prices_retailer 
        ON user_prices(retailer)
      `),
        db.query(`
        CREATE INDEX IF NOT EXISTS idx_photos_barcode 
        ON photos(barcode)
      `),
        db.query(`
        CREATE INDEX IF NOT EXISTS idx_photos_type 
        ON photos(image_type)
      `),
      ]);

      console.log('[Database] ✅ Tables created/verified');
    } else if (process.env.MONGODB_URI) {
      // MongoDB collections are created automatically on first insert
      // No explicit schema creation needed
      console.log('[Database] ✅ MongoDB collections will be created on first insert');
    }
  } catch (error) {
    console.error('[Database] Error creating tables:', error);
    // Continue - tables might already exist
  }
}

/**
 * Get database instance (lazy initialization)
 */
export async function getDatabase(): Promise<any> {
  return await initDatabase();
}

/**
 * Manufacturing Country Submissions
 */
export async function saveManufacturingCountrySubmission(data: {
  barcode: string;
  country: string;
  userId: string;
  photoUrl?: string;
  hasImportedIngredients?: boolean;
}): Promise<void> {
  const database = await getDatabase();
  
  const postgresUrl = getPostgresUrl();
  if (postgresUrl) {
    // Use pg library for direct queries (works with Neon, Supabase)
    await database.query(
      `INSERT INTO manufacturing_country_submissions 
       (barcode, country, user_id, timestamp, photo_url, has_imported_ingredients)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (barcode, user_id) DO UPDATE
       SET country = EXCLUDED.country,
           photo_url = EXCLUDED.photo_url,
           has_imported_ingredients = EXCLUDED.has_imported_ingredients,
           timestamp = EXCLUDED.timestamp`,
      [
        data.barcode,
        data.country,
        data.userId,
        Date.now(),
        data.photoUrl || null,
        data.hasImportedIngredients || false,
      ]
    );
  } else if (process.env.MONGODB_URI) {
    await database.collection('manufacturing_country_submissions').insertOne({
      ...data,
      timestamp: Date.now(),
      verified: false,
      verifiedCount: 1,
      disputed: false,
    });
  } else {
    // In-memory fallback
    if (!database.has('manufacturing_country')) {
      database.set('manufacturing_country', new Map());
    }
    const submissions = database.get('manufacturing_country');
    const key = `${data.barcode}_${data.userId}`;
    submissions.set(key, {
      ...data,
      timestamp: Date.now(),
      verified: false,
      verifiedCount: 1,
      disputed: false,
    });
  }
}

export async function getManufacturingCountrySubmissions(barcode: string): Promise<any[]> {
  const database = await getDatabase();
  
  const postgresUrl = getPostgresUrl();
  if (postgresUrl) {
    const result = await database.query(
      `SELECT 
        barcode,
        country,
        user_id as "userId",
        timestamp,
        verified,
        verified_count as "verifiedCount",
        disputed,
        photo_url as "photoUrl",
        has_imported_ingredients as "hasImportedIngredients"
       FROM manufacturing_country_submissions
       WHERE barcode = $1
       ORDER BY timestamp DESC`,
      [barcode]
    );
    return result.rows;
  } else if (process.env.MONGODB_URI) {
    return await database.collection('manufacturing_country_submissions')
      .find({ barcode })
      .sort({ timestamp: -1 })
      .toArray();
  } else {
    // In-memory fallback
    if (!database.has('manufacturing_country')) {
      return [];
    }
    const submissions = database.get('manufacturing_country');
    return Array.from(submissions.values())
      .filter((s: any) => s.barcode === barcode);
  }
}

/**
 * Manual Products
 */
export async function saveManualProduct(barcode: string, productData: any): Promise<void> {
  const database = await getDatabase();
  
  const postgresUrl = getPostgresUrl();
  if (postgresUrl) {
    await database.query(
      `INSERT INTO manual_products (barcode, product_data, submitted_at)
       VALUES ($1, $2::jsonb, $3)
       ON CONFLICT (barcode) DO UPDATE
       SET product_data = EXCLUDED.product_data,
           submitted_at = EXCLUDED.submitted_at,
           updated_at = NOW()`,
      [barcode, JSON.stringify(productData), Date.now()]
    );
  } else if (process.env.MONGODB_URI) {
    await database.collection('manual_products').replaceOne(
      { barcode },
      {
        barcode,
        productData,
        submittedAt: Date.now(),
        source: 'user_contributed',
      },
      { upsert: true }
    );
  } else {
    // In-memory fallback
    if (!database.has('manual_products')) {
      database.set('manual_products', new Map());
    }
    const products = database.get('manual_products');
    products.set(barcode, {
      ...productData,
      barcode,
      submittedAt: Date.now(),
      source: 'user_contributed',
    });
  }
}

export async function getManualProduct(barcode: string): Promise<any | null> {
  const database = await getDatabase();
  
  const postgresUrl = getPostgresUrl();
  if (postgresUrl) {
    const result = await database.query(
      `SELECT 
        barcode,
        product_data as "productData",
        submitted_at as "submittedAt",
        'user_contributed' as source
       FROM manual_products
       WHERE barcode = $1
       LIMIT 1`,
      [barcode]
    );
    return result.rows[0] || null;
  } else if (process.env.MONGODB_URI) {
    return await database.collection('manual_products').findOne({ barcode });
  } else {
    // In-memory fallback
    if (!database.has('manual_products')) {
      return null;
    }
    const products = database.get('manual_products');
    return products.get(barcode) || null;
  }
}

/**
 * User Prices
 */
export async function saveUserPrice(data: {
  barcode: string;
  price: number;
  currency: string;
  retailer: string;
  location?: string;
  userId: string;
}): Promise<void> {
  const database = await getDatabase();
  
  const postgresUrl = getPostgresUrl();
  if (postgresUrl) {
    await database.query(
      `INSERT INTO user_prices 
       (barcode, price, currency, retailer, location, user_id, timestamp, verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)`,
      [
        data.barcode,
        data.price,
        data.currency,
        data.retailer,
        data.location || null,
        data.userId,
        Date.now(),
      ]
    );
  } else if (process.env.MONGODB_URI) {
    await database.collection('user_prices').insertOne({
      ...data,
      timestamp: Date.now(),
      verified: false,
    });
  } else {
    // In-memory fallback
    if (!database.has('user_prices')) {
      database.set('user_prices', new Map());
    }
    const prices = database.get('user_prices');
    const key = `${data.barcode}_${data.userId}_${Date.now()}`;
    prices.set(key, {
      ...data,
      timestamp: Date.now(),
      verified: false,
    });
  }
}

export async function getUserPrices(barcode: string): Promise<any[]> {
  const database = await getDatabase();
  
  const postgresUrl = getPostgresUrl();
  if (postgresUrl) {
    const result = await database.query(
      `SELECT 
        barcode,
        price,
        currency,
        retailer,
        location,
        user_id as "userId",
        timestamp,
        verified
       FROM user_prices
       WHERE barcode = $1
       ORDER BY timestamp DESC
       LIMIT 50`,
      [barcode]
    );
    return result.rows;
  } else if (process.env.MONGODB_URI) {
    return await database.collection('user_prices')
      .find({ barcode })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();
  } else {
    // In-memory fallback
    if (!database.has('user_prices')) {
      return [];
    }
    const prices = database.get('user_prices');
    return Array.from(prices.values())
      .filter((p: any) => p.barcode === barcode)
      .sort((a: any, b: any) => b.timestamp - a.timestamp)
      .slice(0, 50);
  }
}

/**
 * Photos
 */
export async function savePhoto(data: {
  barcode: string;
  imageType: string;
  photoUrl: string;
  photoData?: string; // Base64 or blob reference
  userId?: string;
}): Promise<string> {
  const database = await getDatabase();
  
  const postgresUrl = getPostgresUrl();
  if (postgresUrl) {
    await database.query(
      `INSERT INTO photos (barcode, image_type, photo_url, photo_data, user_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        data.barcode,
        data.imageType,
        data.photoUrl,
        data.photoData || null,
        data.userId || null,
      ]
    );
    return data.photoUrl;
  } else if (process.env.MONGODB_URI) {
    const result = await database.collection('photos').insertOne({
      ...data,
      createdAt: new Date(),
    });
    return data.photoUrl;
  } else {
    // In-memory fallback
    if (!database.has('photos')) {
      database.set('photos', new Map());
    }
    const photos = database.get('photos');
    const key = `${data.barcode}_${data.imageType}_${Date.now()}`;
    photos.set(key, {
      ...data,
      createdAt: Date.now(),
    });
    return data.photoUrl;
  }
}

export async function getPhotos(barcode: string, imageType?: string): Promise<any[]> {
  const database = await getDatabase();
  
  const postgresUrl = getPostgresUrl();
  if (postgresUrl) {
    let query = `SELECT * FROM photos WHERE barcode = $1`;
    const params: any[] = [barcode];
    
    if (imageType) {
      query += ` AND image_type = $2`;
      params.push(imageType);
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const result = await database.query(query, params);
    return result.rows;
  } else if (process.env.MONGODB_URI) {
    const filter: any = { barcode };
    if (imageType) {
      filter.imageType = imageType;
    }
    return await database.collection('photos')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();
  } else {
    // In-memory fallback
    if (!database.has('photos')) {
      return [];
    }
    const photos = database.get('photos');
    return Array.from(photos.values())
      .filter((p: any) => {
        if (p.barcode !== barcode) return false;
        if (imageType && p.imageType !== imageType) return false;
        return true;
      })
      .sort((a: any, b: any) => b.createdAt - a.createdAt);
  }
}

async function ensureContributionEvidenceTable(database: any): Promise<void> {
  await database.query(`
    CREATE TABLE IF NOT EXISTS contribution_evidence (
      evidence_id TEXT PRIMARY KEY,
      barcode TEXT NOT NULL,
      evidence_json JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await database.query(`
    CREATE INDEX IF NOT EXISTS contribution_evidence_barcode_idx
    ON contribution_evidence (barcode)
  `);
}

export async function saveContributionEvidence(
  evidenceId: string,
  barcode: string,
  evidence: Record<string, unknown>
): Promise<void> {
  const database = await getDatabase();
  const postgresUrl = getPostgresUrl();
  if (postgresUrl) {
    await ensureContributionEvidenceTable(database);
    await database.query(
      `INSERT INTO contribution_evidence (evidence_id, barcode, evidence_json, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (evidence_id)
       DO UPDATE SET evidence_json = EXCLUDED.evidence_json, barcode = EXCLUDED.barcode, updated_at = NOW()`,
      [evidenceId, barcode, JSON.stringify(evidence)]
    );
    return;
  }
  if (process.env.MONGODB_URI) {
    await database.collection('contribution_evidence').updateOne(
      { evidenceId },
      { $set: { evidenceId, barcode, evidence, updatedAt: Date.now() } },
      { upsert: true }
    );
    return;
  }
  if (!database.has('contribution_evidence')) {
    database.set('contribution_evidence', new Map());
  }
  database.get('contribution_evidence').set(evidenceId, { evidenceId, barcode, evidence });
}

export async function getContributionEvidenceById(
  evidenceId: string
): Promise<Record<string, unknown> | null> {
  const database = await getDatabase();
  const postgresUrl = getPostgresUrl();
  if (postgresUrl) {
    await ensureContributionEvidenceTable(database);
    const result = await database.query(
      `SELECT evidence_json FROM contribution_evidence WHERE evidence_id = $1`,
      [evidenceId]
    );
    return result.rows[0]?.evidence_json ?? null;
  }
  if (process.env.MONGODB_URI) {
    const row = await database.collection('contribution_evidence').findOne({ evidenceId });
    return row?.evidence ?? null;
  }
  if (!database.has('contribution_evidence')) return null;
  return database.get('contribution_evidence').get(evidenceId)?.evidence ?? null;
}

export async function listContributionEvidenceForBarcode(
  barcode: string
): Promise<Record<string, unknown>[]> {
  const database = await getDatabase();
  const postgresUrl = getPostgresUrl();
  if (postgresUrl) {
    await ensureContributionEvidenceTable(database);
    const result = await database.query(
      `SELECT evidence_json FROM contribution_evidence WHERE barcode = $1 ORDER BY updated_at DESC`,
      [barcode]
    );
    return result.rows.map((r: { evidence_json: Record<string, unknown> }) => r.evidence_json);
  }
  if (process.env.MONGODB_URI) {
    const rows = await database
      .collection('contribution_evidence')
      .find({ barcode })
      .toArray();
    return rows.map((r: { evidence: Record<string, unknown> }) => r.evidence);
  }
  if (!database.has('contribution_evidence')) return [];
  return Array.from(database.get('contribution_evidence').values())
    .filter((r: { barcode: string }) => r.barcode === barcode)
    .map((r: { evidence: Record<string, unknown> }) => r.evidence);
}
