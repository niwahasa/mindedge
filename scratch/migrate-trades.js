import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

async function migrate() {
  console.log('Running column migrations...');

  try {
    // Add missing columns to trades table if they don't exist
    await sql`
      ALTER TABLE trades 
      ADD COLUMN IF NOT EXISTS followed_plan TEXT DEFAULT 'yes',
      ADD COLUMN IF NOT EXISTS mistake_tag TEXT;
    `;
    console.log('✅ Added followed_plan and mistake_tag columns to trades table.');

    // Verify the columns
    const cols = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'trades' AND table_schema = 'public'
      ORDER BY column_name;
    `;
    console.log('Current trades columns:', cols.map(c => c.column_name).join(', '));

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await sql.end();
  }
}

migrate();
