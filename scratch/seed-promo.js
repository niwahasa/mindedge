import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function seed() {
  console.log('Seeding promo codes...');
  
  const { data, error } = await supabase
    .from('promo_codes')
    .upsert([
      { 
        code: 'MINDEDGE_FREE', 
        discount_percent: 100, 
        usage_limit: 1000, 
        is_active: true 
      },
      { 
        code: 'BUNNY_VIP', 
        discount_percent: 100, 
        usage_limit: 10, 
        is_active: true 
      }
    ], { onConflict: 'code' });

  if (error) {
    console.error('Error seeding promo codes:', error);
  } else {
    console.log('Successfully seeded promo codes: MINDEDGE_FREE, BUNNY_VIP');
  }
}

seed();
