import { captionObjectPath, captionsFolder } from "./captions";
import { galleryBucket, supabase } from "./supabase";

export type PhotoCaption = {
  title: string;
  description: string;
};

const memory = new Map<string, PhotoCaption>();

export function getCachedCaption(id: string) {
  return memory.get(id) ?? null;
}

export function setCachedCaption(id: string, caption: PhotoCaption) {
  memory.set(id, caption);
}

function parseCaption(raw: string): PhotoCaption | null {
  try {
    const parsed = JSON.parse(raw) as { title?: string; description?: string };
    const title = parsed.title?.trim() ?? "";
    const description = parsed.description?.trim() ?? "";
    if (!title || !description) return null;
    return { title, description };
  } catch {
    return null;
  }
}

export async function fetchStoredCaption(id: string): Promise<PhotoCaption | null> {
  const cached = memory.get(id);
  if (cached) return cached;
  if (!supabase) return null;

  const { data, error } = await supabase.storage.from(galleryBucket).download(captionObjectPath(id));
  if (error || !data) return null;

  const caption = parseCaption(await data.text());
  if (!caption) return null;
  memory.set(id, caption);
  return caption;
}

export async function prefetchStoredCaptions() {
  const db = supabase;
  if (!db) return;

  const { data: files, error } = await db.storage.from(galleryBucket).list(captionsFolder, {
    limit: 1000,
  });
  if (error || !files) return;

  await Promise.all(
    files.map(async (file) => {
      if (!file.name.endsWith(".json") || file.name.startsWith("_")) return;
      const id = file.name.replace(/\.json$/i, "");
      if (memory.has(id)) return;
      const { data } = await db.storage.from(galleryBucket).download(`${captionsFolder}/${file.name}`);
      if (!data) return;
      const caption = parseCaption(await data.text());
      if (caption) memory.set(id, caption);
    }),
  );
}
