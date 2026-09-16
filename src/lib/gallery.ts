import {
  categoryFromFolder,
  isImageFile,
  type GalleryItem,
  type PhotoCategory,
} from "../data/gallery";
import { galleryBucket, isSupabaseConfigured, supabase } from "./supabase";

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
      await addImagesFromFolder(entry.name, categoryFromFolder(entry.name), items);
      continue;
    }
    addImage(entry.name, "", "Crafts", entry.id, items, entry.created_at);
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
    addImage(file.name, prefix, category, file.id, items, file.created_at);
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

function addImage(
  name: string,
  prefix: string,
  category: PhotoCategory,
  id: string | null,
  items: GalleryItem[],
  createdAt?: string | null,
) {
  if (!supabase || !isImageFile(name)) return;
  const storagePath = prefix ? `${prefix}/${name}` : name;
  const { data } = supabase.storage.from(galleryBucket).getPublicUrl(storagePath);
  const year = createdAt ? String(new Date(createdAt).getFullYear()) : "";
  items.push({
    id: id ?? storagePath,
    title: year ? `Photo · ${year}` : "Photo",
    category,
    image: data.publicUrl,
    maker: "",
    year,
    memory: "",
    aspect: "portrait",
  });
}

function isFolder(entry: { id: string | null; metadata: unknown }) {
  return entry.id === null || entry.metadata === null;
}
