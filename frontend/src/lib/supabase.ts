import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function supabaseUrl(): string {
  return String(import.meta.env.VITE_SUPABASE_URL || "").trim();
}

function supabaseAnonKey(): string {
  return String(import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();
}

export function isSupabaseConfigured(): boolean {
  const url = supabaseUrl();
  const key = supabaseAnonKey();
  return Boolean(url && key && !url.includes("YOUR_PROJECT"));
}

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(supabaseUrl(), supabaseAnonKey(), {
      auth: {
        // We exchange ?code= ourselves in AuthContext so a failed / cross-domain
        // callback cannot hang the app on a blank screen.
        detectSessionInUrl: false,
        persistSession: true,
        autoRefreshToken: true,
        flowType: "pkce",
      },
    });
  }
  return client;
}
