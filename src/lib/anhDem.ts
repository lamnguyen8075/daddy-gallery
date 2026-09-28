import { supabase } from "./supabase";

export type PhotoCounts = {
  hearts: number;
  views: number;
};

export type CountsMap = Record<string, PhotoCounts>;

export async function fetchPhotoCounts(): Promise<CountsMap> {
  if (!supabase) return {};
  const { data, error } = await supabase.from("anh_dem").select("photo_id, hearts, views, upvotes");
  if (error || !data) return {};
  const next: CountsMap = {};
  for (const row of data) {
    if (!row.photo_id) continue;
    next[row.photo_id] = {
      hearts: Math.max(Number(row.hearts) || 0, Number(row.upvotes) || 0),
      views: Number(row.views) || 0,
    };
  }
  return next;
}

export async function addHeart(photoId: string): Promise<number | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("cong_tim", { p_photo_id: photoId });
  if (error) return null;
  return typeof data === "number" ? data : Number(data) || null;
}

export async function addView(photoId: string): Promise<number | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("cong_xem", { p_photo_id: photoId });
  if (error) return null;
  return typeof data === "number" ? data : Number(data) || null;
}
