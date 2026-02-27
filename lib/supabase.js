import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Таблица prices:
// id, product, price, currency, unit, source, region, date, created_at
// Таблица news:
// id, title, content, source, region, published_at, created_at
