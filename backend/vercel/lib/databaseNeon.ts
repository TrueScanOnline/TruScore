/**
 * Database Service for Neon Postgres
 * Direct connection using pg library (works with Neon, Supabase, etc.)
 */

import { Pool, QueryResult } from 'pg';

let pool: Pool | null = null;

/**
 * Initialize database connection
 */
async function initDatabase(): Promise<Pool> {
  if (pool) {
    return pool;
  }

  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL environment variable not set');
  }

  pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: process.env.POSTGRES_URL.includes('sslmode=require') 
      ? { rejectUnauthorized: false } 
      : undefined,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  console.log('[Database] ✅ Connected to Postgres (Neon/Supabase)');
  
  // Test connection and create tables
  try {
    await pool.query('SELECT NOW()');
    await createTables();
  } catch (error) {
    console.error('[Database] Error initializing:', error);
    throw error;
  }

  return pool;
}

/**
 * Create database tables
 */
async function createTables(): Promise<void> {
  if (!pool) {
    await initDatabase();
  }

  try {
    // Manufacturing Country Submissions
    await pool!.query(`
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
      );
    `);

    await pool!.query(`
      CREATE INDEX IF NOT EXISTS idx_manufacturing_country_barcode 
      ON manufacturing_country_submissions(barcode);
    `);

    await pool!.query(`
      CREATE INDEX IF NOT EXISTS idx_manufacturing_country_user 
      ON manufacturing_country_submissions(user_id);
    `);

    // Manual Products
    await pool!.query(`
      CREATE TABLE IF NOT EXISTS manual_products (
        id SERIAL PRIMARY KEY,
        barcode VARCHAR(20) UNIQUE NOT NULL,
        product_data JSONB NOT NULL,
        submitted_at BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool!.query(`
      CREATE INDEX IF NOT EXISTS idx_manual_products_barcode 
      ON manual_products(barcode);
    `);

    // User Prices
    await pool!.query(`
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
      );
    `);

    await pool!.query(`
      CREATE INDEX IF NOT EXISTS idx_user_prices_barcode 
      ON user_prices(barcode);
    `);

    await pool!.query(`
      CREATE INDEX IF NOT EXISTS idx_user_prices_retailer 
      ON user_prices(retailer);
    `);

    // Photos
    await pool!.query(`
      CREATE TABLE IF NOT EXISTS photos (
        id SERIAL PRIMARY KEY,
        barcode VARCHAR(20) NOT NULL,
        image_type VARCHAR(50) NOT NULL,
        photo_url TEXT NOT NULL,
        photo_data TEXT,
        user_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool!.query(`
      CREATE INDEX IF NOT EXISTS idx_photos_barcode 
      ON photos(barcode);
    `);

    await pool!.query(`
      CREATE INDEX IF NOT EXISTS idx_photos_type 
      ON photos(image_type);
    `);

    console.log('[Database] ✅ Tables created/verified');
  } catch (error) {
    console.error('[Database] Error creating tables:', error);
    // Continue - tables might already exist
  }
}

/**
 * Get database pool (lazy initialization)
 */
export async function getDatabase(): Promise<Pool> {
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
  const db = await getDatabase();
  await db.query(
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
}

export async function getManufacturingCountrySubmissions(barcode: string): Promise<any[]> {
  const db = await getDatabase();
  const result = await db.query(
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
}

/**
 * Manual Products
 */
export async function saveManualProduct(barcode: string, productData: any): Promise<void> {
  const db = await getDatabase();
  await db.query(
    `INSERT INTO manual_products (barcode, product_data, submitted_at)
     VALUES ($1, $2::jsonb, $3)
     ON CONFLICT (barcode) DO UPDATE
     SET product_data = EXCLUDED.product_data,
         submitted_at = EXCLUDED.submitted_at,
         updated_at = NOW()`,
    [barcode, JSON.stringify(productData), Date.now()]
  );
}

export async function getManualProduct(barcode: string): Promise<any | null> {
  const db = await getDatabase();
  const result = await db.query(
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
  const db = await getDatabase();
  await db.query(
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
}

export async function getUserPrices(barcode: string): Promise<any[]> {
  const db = await getDatabase();
  const result = await db.query(
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
}

/**
 * Photos
 */
export async function savePhoto(data: {
  barcode: string;
  imageType: string;
  photoUrl: string;
  photoData?: string;
  userId?: string;
}): Promise<string> {
  const db = await getDatabase();
  await db.query(
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
}

export async function getPhotos(barcode: string, imageType?: string): Promise<any[]> {
  const db = await getDatabase();
  let query = `SELECT * FROM photos WHERE barcode = $1`;
  const params: any[] = [barcode];
  
  if (imageType) {
    query += ` AND image_type = $2`;
    params.push(imageType);
  }
  
  query += ` ORDER BY created_at DESC`;
  
  const result = await db.query(query, params);
  return result.rows;
}
