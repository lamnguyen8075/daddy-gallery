import { supabase } from "./supabase";

export type ActivityKind = "tim" | "binh_luan" | "anh";

export type ActivityRow = {
  id: string;
  kind: ActivityKind;
  photoId: string;
  name: string;
  body: string;
  createdAt: string;
};

const weekMs = 7 * 24 * 60 * 60 * 1000;
const changeEvent = "bang-tin";

function ping() {
  window.dispatchEvent(new Event(changeEvent));
}

export function onActivityChange(fn: () => void) {
  window.addEventListener(changeEvent, fn);
  return () => window.removeEventListener(changeEvent, fn);
}

function sinceIso() {
  return new Date(Date.now() - weekMs).toISOString();
}

function asHeart(row: {
  id: string;
  kind: string;
  photo_id: string;
  ten: string | null;
  noi_dung: string | null;
  created_at: string;
}): ActivityRow | null {
  if (row.kind !== "tim" || !row.created_at) return null;
  return {
    id: row.id,
    kind: "tim",
    photoId: row.photo_id,
    name: (row.ten || "").trim(),
    body: (row.noi_dung || "").trim(),
    createdAt: row.created_at,
  };
}

export async function fetchActivity(
  photos: { id: string; createdAt?: string }[] = [],
): Promise<ActivityRow[]> {
  if (!supabase) return [];
  const since = sinceIso();
  const rows: ActivityRow[] = [];

  const [hearts, comments] = await Promise.all([
    supabase
      .from("bang_tin")
      .select("id, kind, photo_id, ten, noi_dung, created_at")
      .eq("kind", "tim")
      .gt("created_at", since)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("binh_luan")
      .select("id, photo_id, ten, noi_dung, created_at")
      .gt("created_at", since)
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  for (const row of hearts.data ?? []) {
    const next = asHeart(row);
    if (next) rows.push(next);
  }

  for (const row of comments.data ?? []) {
    if (!row.created_at) continue;
    rows.push({
      id: row.id,
      kind: "binh_luan",
      photoId: row.photo_id,
      name: (row.ten || "").trim(),
      body: (row.noi_dung || "").trim(),
      createdAt: row.created_at,
    });
  }

  for (const photo of photos) {
    if (!photo.createdAt || photo.createdAt <= since) continue;
    rows.push({
      id: `anh:${photo.id}`,
      kind: "anh",
      photoId: photo.id,
      name: "",
      body: "",
      createdAt: photo.createdAt,
    });
  }

  rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
  return rows.slice(0, 40);
}

export function logActivity(input: {
  kind: ActivityKind;
  photoId: string;
  name?: string;
  body?: string;
}) {
  if (!supabase || !input.photoId) return;
  void supabase
    .from("bang_tin")
    .insert({
      kind: input.kind,
      photo_id: input.photoId.slice(0, 120),
      ten: (input.name || "").trim().slice(0, 40),
      noi_dung: (input.body || "").trim().slice(0, 160),
      created_at: new Date().toISOString(),
    })
    .then(() => {
      ping();
    });
}
