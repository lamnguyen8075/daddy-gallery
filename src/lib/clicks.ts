import { supabase } from "./supabase";

export type ClickRow = {
  id: string;
  kind: string;
  target: string | null;
  created_at: string;
};

export function logClick(kind: string, target?: string) {
  if (!supabase) return;
  void supabase.from("clicks").insert({ kind, target: target || null });
}

export async function fetchClicks(): Promise<ClickRow[]> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("clicks")
    .select("id, kind, target, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw error;
  return data ?? [];
}
