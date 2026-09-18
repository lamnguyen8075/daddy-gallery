import { captionObjectPath, captionsFolder } from "./captions";
import { galleryBucket, supabase, versionedUrl } from "./supabase";

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

export function clearCachedCaption(id: string) {
  memory.delete(id);
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

async function readCaptionFile(path: string): Promise<PhotoCaption | null> {
  if (!supabase) return null;
  const { data: file } = supabase.storage.from(galleryBucket).getPublicUrl(path);
  const response = await fetch(versionedUrl(file.publicUrl, String(Date.now())), { cache: "no-store" });
  if (!response.ok) return null;
  return parseCaption(await response.text());
}

export async function fetchStoredCaption(id: string): Promise<PhotoCaption | null> {
  const cached = memory.get(id);
  if (cached) return cached;

  const caption = await readCaptionFile(captionObjectPath(id));
  if (!caption) return null;
  memory.set(id, caption);
  return caption;
}

export async function prefetchStoredCaptions() {
  if (!supabase) return;

  const { data: files, error } = await supabase.storage.from(galleryBucket).list(captionsFolder, {
    limit: 1000,
  });
  if (error || !files) return;

  await Promise.all(
    files.map(async (file) => {
      if (!file.name.endsWith(".json") || file.name.startsWith("_")) return;
      const id = file.name.replace(/\.json$/i, "");
      const caption = await readCaptionFile(`${captionsFolder}/${file.name}`);
      if (caption) memory.set(id, caption);
    }),
  );
}
