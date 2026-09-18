import {
  categoryFromFolder,
  isImageFile,
  type GalleryItem,
  type PhotoCategory,
} from "../data/gallery";
import { galleryBucket, isSupabaseConfigured, supabase, versionedUrl } from "./supabase";

type StorageFile = {
  id: string | null;
  name: string;
  created_at?: string | null;
  updated_at?: string | null;
  metadata: unknown;
};

export async function fetchGalleryItems(): Promise<GalleryItem[]> {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error(
      "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file, then restart the dev server.",
    );
  }

  const items: GalleryItem[] = [];
  const root = await listFolder("");

  for (const entry of root) {
    if (isFolder(entry)) {
      if (entry.name === "captions") continue;
      await addImagesFromFolder(entry.name, categoryFromFolder(entry.name), items);
      continue;
    }
    addImage(entry, "", "Crafts", items);
  }

  return items;
}

async function addImagesFromFolder(
  prefix: string,
  category: PhotoCategory,
  items: GalleryItem[],
) {
  const files = await listFolder(prefix);
  for (const file of files) {
    if (isFolder(file)) continue;
    addImage(file, prefix, category, items);
  }
}

async function listFolder(prefix: string) {
  if (!supabase) return [];

  const { data, error } = await supabase.storage.from(galleryBucket).list(prefix, {
    limit: 1000,
    sortBy: { column: "created_at", order: "desc" },
  });

  if (error) {
    throw new Error(
      error.message.toLowerCase().includes("not found")
        ? `The "${galleryBucket}" bucket was not found. In Supabase, open Storage and create a public bucket named "${galleryBucket}".`
        : error.message,
    );
  }

  return data ?? [];
}

function addImage(file: StorageFile, prefix: string, category: PhotoCategory, items: GalleryItem[]) {
  if (!supabase || !isImageFile(file.name)) return;
  const storagePath = prefix ? `${prefix}/${file.name}` : file.name;
  const { data } = supabase.storage.from(galleryBucket).getPublicUrl(storagePath);
  const version = file.updated_at ?? file.created_at ?? file.id ?? file.name;
  const year = file.created_at ? String(new Date(file.created_at).getFullYear()) : "";
  items.push({
    id: file.id ?? storagePath,
    path: storagePath,
    title: year ? `Photo · ${year}` : "Photo",
    category,
    image: versionedUrl(data.publicUrl, version),
    maker: "",
    year,
    memory: "",
    aspect: "portrait",
  });
}

function isFolder(entry: { id: string | null; metadata: unknown }) {
  return entry.id === null || entry.metadata === null;
}
