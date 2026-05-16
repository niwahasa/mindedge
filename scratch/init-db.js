import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

async function init() {
  console.log('Initializing database tables...');
  
  try {
    // Create Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        username TEXT NOT NULL,
        plan TEXT DEFAULT 'free',
        streak INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Create Registry table
    await sql`
      CREATE TABLE IF NOT EXISTS users_registry (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        user_id UUID REFERENCES users(id) NOT NULL
      );
    `;

    // Create Trades table
    await sql`
      CREATE TABLE IF NOT EXISTS trades (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) NOT NULL,
        pair TEXT NOT NULL,
        direction TEXT NOT NULL,
        setup TEXT NOT NULL,
        session TEXT NOT NULL,
        risk_amount DECIMAL(10,2),
        rr_ratio DECIMAL(10,2) NOT NULL,
        result TEXT NOT NULL,
        emotion_before TEXT,
        emotion_after TEXT,
        notes TEXT,
        chart_link TEXT,
        traded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Create Promo Codes table
    await sql`
      CREATE TABLE IF NOT EXISTS promo_codes (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        discount_percent INTEGER NOT NULL,
        usage_limit INTEGER DEFAULT 100,
        used_count INTEGER DEFAULT 0,
        expires_at TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT TRUE
      );
    `;

    // Create Subscriptions table
    await sql`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) NOT NULL,
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        status TEXT NOT NULL,
        current_period_end TIMESTAMP WITH TIME ZONE
      );
    `;

    console.log('All tables created successfully!');
    
    // Seed initial promo codes
    console.log('Seeding initial promo codes...');
    await sql`
      INSERT INTO promo_codes (code, discount_percent, usage_limit, is_active)
      VALUES ('MINDEDGE_FREE', 100, 1000, TRUE), ('BUNNY_VIP', 100, 10, TRUE)
      ON CONFLICT (code) DO NOTHING;
    `;
    console.log('Seeding complete.');

  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    await sql.end();
  }
}

init();
