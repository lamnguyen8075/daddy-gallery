import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

export const galleryBucket =
  import.meta.env.VITE_SUPABASE_BUCKET?.trim() || "handmade";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const appBuild = String(import.meta.env.VITE_BUILD || "dev");

export function versionedUrl(url: string, version: string) {
  const joiner = url.includes("?") ? "&" : "?";
  return `${url}${joiner}v=${encodeURIComponent(version)}`;
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;
