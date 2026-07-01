import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/** Server-side Supabase client for public data reads (no cookie session). */
export const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
