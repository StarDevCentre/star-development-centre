import { createClient } from "@supabase/supabase-js";

// Reuse one browser client across the badge and player portal components.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const supabaseBrowser = url && key ? createClient(url, key) : null;
