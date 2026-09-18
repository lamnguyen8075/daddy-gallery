import type { GalleryItem } from "../data/gallery";
import { isImageFile } from "../data/gallery";
import type { PhotoCaption } from "./captionStore";
import { captionObjectPath } from "./captions";
import { galleryBucket, isSupabaseConfigured, supabase } from "./supabase";

export const uploadsFolder = "uploads";
const maxBytes = 8 * 1024 * 1024;
const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

export function validateUploadFile(file: File) {
  if (!allowedTypes.has(file.type) && !isImageFile(file.name)) {
    throw new Error("Dùng ảnh chụp từ điện thoại, JPG hoặc PNG.");
  }
  if (file.size > maxBytes) {
    throw new Error("Ảnh này lớn quá. Chọn ảnh dưới 8MB.");
  }
}

function fileExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^(jpe?g|png|webp|gif|heic|heif)$/.test(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  if (file.type === "image/heic" || file.type === "image/heif") return "heic";
  return "jpg";
}

export async function uploadGalleryImage(file: File): Promise<GalleryItem> {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error("Chưa kết nối được phòng tranh.");
  }
  validateUploadFile(file);

  const name = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${fileExtension(file)}`;
  const path = `${uploadsFolder}/${name}`;
  const { error } = await supabase.storage.from(galleryBucket).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) {
    throw new Error(
      /row-level security|policy|not allowed/i.test(error.message)
        ? "Chưa mở quyền gửi ảnh. Trong SQL editor, chạy file supabase/uploads.sql."
        : error.message,
    );
  }

  const { data: files, error: listError } = await supabase.storage.from(galleryBucket).list(uploadsFolder, {
    limit: 1000,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (listError) throw new Error(listError.message);

  const stored = files?.find((entry) => entry.name === name);
  const { data } = supabase.storage.from(galleryBucket).getPublicUrl(path);
  const year = String(new Date().getFullYear());

  return {
    id: stored?.id ?? path,
    path,
    title: "Ảnh mới gửi",
    category: "Crafts",
    image: data.publicUrl,
    maker: "",
    year,
    memory: "",
    aspect: "portrait",
  };
}

export async function generateCaption(id: string, image: string): Promise<PhotoCaption | null> {
  try {
    const response = await fetch("/api/describe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, image }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as Partial<PhotoCaption>;
    const title = data.title?.trim() ?? "";
    const description = data.description?.trim() ?? "";
    if (!title || !description) return null;
    return { title, description };
  } catch {
    return null;
  }
}

export async function deleteGalleryImage(item: GalleryItem) {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error("Chưa kết nối được phòng tranh.");
  }

  const paths = [item.path, captionObjectPath(item.id)].filter(Boolean);
  const { error } = await supabase.storage.from(galleryBucket).remove(paths);
  if (error) {
    throw new Error(
      /row-level security|policy|not allowed/i.test(error.message)
        ? "Chưa mở quyền xóa ảnh. Trong SQL editor, chạy thêm phần xóa ở supabase/uploads.sql."
        : error.message,
    );
  }
}
