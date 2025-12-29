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

  // Shops table
  await sql`
    CREATE TABLE IF NOT EXISTS shops (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      address VARCHAR(500),
      phone VARCHAR(50),
      opening_time TIME DEFAULT '09:00',
      closing_time TIME DEFAULT '18:00',
      slot_duration INTEGER DEFAULT 30,
      max_capacity INTEGER DEFAULT 1,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
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

  // Create indexes for better performance
  await sql`CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_reservations_shop ON reservations(shop_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_users_facebook ON users(facebook_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_users_google ON users(google_id)`;

  console.log('Database initialized successfully');
}

