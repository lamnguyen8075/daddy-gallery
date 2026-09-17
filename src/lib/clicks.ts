import { supabase } from "./supabase";

const table = "nhatky";

export type ClickRow = {
  id: string;
  kind: string;
  target: string | null;
  created_at: string;
};

export function logClick(kind: string, target?: string) {
  if (!supabase) return;
  void supabase
    .from(table)
    .insert({ kind, target: target || null })
    .then(({ error }) => {
      if (error) console.error("Không ghi được lượt bấm:", error.message);
    });
}

export async function fetchClicks(): Promise<{ rows: ClickRow[]; total: number }> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error, count } = await supabase
    .from(table)
    .select("id, kind, target, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw error;
  const rows = data ?? [];
  return { rows, total: count ?? rows.length };
}
