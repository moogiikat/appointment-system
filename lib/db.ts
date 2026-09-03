import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default sql;

// Database initialization script
export async function initializeDatabase() {
  // Users table with password field for admin users
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      facebook_id VARCHAR(255) UNIQUE,
      google_id VARCHAR(255) UNIQUE,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      password VARCHAR(255),
      role VARCHAR(50) DEFAULT 'customer',
      shop_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  // Add password column if it doesn't exist (for existing databases)
  await sql`
    DO $$ 
    BEGIN 
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password') THEN
        ALTER TABLE users ADD COLUMN password VARCHAR(255);
      END IF;
    END $$;
  `;
  
  // Add google_id column if it doesn't exist (for existing databases)
  await sql`
    DO $$ 
    BEGIN 
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='google_id') THEN
        ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;
      END IF;
    END $$;
  `;
  
  // Add avatar column if it doesn't exist (for existing databases)
  await sql`
    DO $$ 
    BEGIN 
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='avatar') THEN
        ALTER TABLE users ADD COLUMN avatar TEXT;
      END IF;
    END $$;
  `;

  // Shops table
  await sql`
    CREATE TABLE IF NOT EXISTS shops (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      address VARCHAR(500),
      phone VARCHAR(50),
      icon VARCHAR(500),
      opening_time TIME DEFAULT '09:00',
      closing_time TIME DEFAULT '18:00',
      slot_duration INTEGER DEFAULT 30,
      max_capacity INTEGER DEFAULT 1,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  // Add icon column if it doesn't exist (for existing databases)
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shops' AND column_name='icon') THEN
        ALTER TABLE shops ADD COLUMN icon VARCHAR(500);
      END IF;
    END $$;
  `;

  // Add category column if it doesn't exist (for existing databases)
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shops' AND column_name='category') THEN
        ALTER TABLE shops ADD COLUMN category VARCHAR(100);
      END IF;
    END $$;
  `;

  // Add district column if it doesn't exist (for existing databases)
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shops' AND column_name='district') THEN
        ALTER TABLE shops ADD COLUMN district VARCHAR(100);
      END IF;
    END $$;
  `;

  // Add photos column if it doesn't exist (for existing databases)
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shops' AND column_name='photos') THEN
        ALTER TABLE shops ADD COLUMN photos TEXT[] DEFAULT '{}';
      END IF;
    END $$;
  `;

  // Add points_per_visit column if it doesn't exist (for existing databases)
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shops' AND column_name='points_per_visit') THEN
        ALTER TABLE shops ADD COLUMN points_per_visit INTEGER DEFAULT 0;
      END IF;
    END $$;
  `;

  // Reservations table
  await sql`
    CREATE TABLE IF NOT EXISTS reservations (
      id SERIAL PRIMARY KEY,
      shop_id INTEGER REFERENCES shops(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      customer_name VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(50),
      customer_email VARCHAR(255),
      reservation_date DATE NOT NULL,
      reservation_time TIME NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Shop services table (menu / price list)
  await sql`
    CREATE TABLE IF NOT EXISTS shop_services (
      id SERIAL PRIMARY KEY,
      shop_id INTEGER REFERENCES shops(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      price INTEGER,
      duration_minutes INTEGER,
      description TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Reviews table
  await sql`
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      shop_id INTEGER REFERENCES shops(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      reservation_id INTEGER REFERENCES reservations(id) ON DELETE SET NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      shop_reply TEXT,
      shop_reply_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(shop_id, reservation_id)
    )
  `;

  // Favorites table
  await sql`
    CREATE TABLE IF NOT EXISTS favorites (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      shop_id INTEGER REFERENCES shops(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, shop_id)
    )
  `;

  // Point transactions table (loyalty points ledger, no real payment involved)
  await sql`
    CREATE TABLE IF NOT EXISTS point_transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      shop_id INTEGER REFERENCES shops(id) ON DELETE CASCADE,
      reservation_id INTEGER REFERENCES reservations(id) ON DELETE SET NULL,
      amount INTEGER NOT NULL,
      reason VARCHAR(50) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(reservation_id, reason)
    )
  `;

  // Shop coupons table (redeemable with points, no monetary settlement)
  await sql`
    CREATE TABLE IF NOT EXISTS shop_coupons (
      id SERIAL PRIMARY KEY,
      shop_id INTEGER REFERENCES shops(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      points_cost INTEGER NOT NULL DEFAULT 0,
      max_claims INTEGER,
      claimed_count INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // User coupons table (a user's claimed coupon wallet)
  await sql`
    CREATE TABLE IF NOT EXISTS user_coupons (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      coupon_id INTEGER REFERENCES shop_coupons(id) ON DELETE CASCADE,
      shop_id INTEGER REFERENCES shops(id) ON DELETE CASCADE,
      code VARCHAR(20) UNIQUE NOT NULL,
      points_spent INTEGER NOT NULL DEFAULT 0,
      claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      used_at TIMESTAMP
    )
  `;

  // Create indexes for better performance
  await sql`CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_reservations_shop ON reservations(shop_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_users_facebook ON users(facebook_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_users_google ON users(google_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_reviews_shop ON reviews(shop_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_shop_services_shop ON shop_services(shop_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_point_transactions_user ON point_transactions(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_shop_coupons_shop ON shop_coupons(shop_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_user_coupons_user ON user_coupons(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_user_coupons_code ON user_coupons(code)`;

  console.log('Database initialized successfully');
}

