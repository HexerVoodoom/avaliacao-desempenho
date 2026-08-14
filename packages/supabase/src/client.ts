import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface StudioSupabaseConfig {
  url: string;
  anonKey: string;
}

/**
 * One client per app (client-app / studio-admin), both pointing at the same
 * Supabase project. Tenant isolation is enforced by RLS (see migrations/),
 * never by client-side filtering alone.
 */
export function createStudioClient(config: StudioSupabaseConfig): SupabaseClient {
  return createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}
