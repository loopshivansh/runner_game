import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase access using the service-role key. All DB reads/writes and
 * asset uploads go through API routes so the browser never handles Supabase keys.
 *
 * When env vars are absent the app degrades gracefully: the game falls back to
 * DEFAULT_CONFIG and lead capture becomes a no-op that still lets players through.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const CONFIG_TABLE = "loop_runner_config";
export const LEADS_TABLE = "loop_runner_leads";
export const ASSET_BUCKET = "game-assets";

let cached: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient | null {
  if (!url || !serviceKey) return null;
  if (cached) return cached;
  cached = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(url && serviceKey);
}

export function getSupabaseUrl(): string | undefined {
  return url;
}
