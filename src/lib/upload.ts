import type { GalleryItem } from "../data/gallery";
import { isImageFile } from "../data/gallery";
import { captionObjectPath } from "./captions";
import { galleryBucket, isSupabaseConfigured, supabase } from "./supabase";

export const uploadsFolder = "uploads";
export const maxUploadBytes = 8 * 1024 * 1024;
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

function jpgName(name: string) {
  return name.replace(/\.[^.]+$/, "") + ".jpg";
}

async function readBitmap(file: File) {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return createImageBitmap(file);
  }
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
  });
}

export async function prepareUploadFile(file: File): Promise<File> {
  validateUploadFile(file);
  if (file.size <= maxUploadBytes) return file;

  const bitmap = await readBitmap(file);
  const edges = [2048, 1600, 1280, 1024, 800];
  const qualities = [0.84, 0.74, 0.64, 0.54, 0.42];

  try {
    for (const edge of edges) {
      const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Không thu nhỏ được ảnh.");
      context.drawImage(bitmap, 0, 0, width, height);

      for (const quality of qualities) {
        const blob = await canvasToJpeg(canvas, quality);
        if (blob && blob.size <= maxUploadBytes) {
          return new File([blob], jpgName(file.name), { type: "image/jpeg", lastModified: Date.now() });
        }
      }
    }
  } finally {
    bitmap.close();
  }

  throw new Error("Ảnh vẫn lớn quá sau khi thu nhỏ. Thử chụp gần hơn một chút.");
}

export async function uploadGalleryImage(file: File): Promise<GalleryItem> {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error("Chưa kết nối được phòng tranh.");
  }
  validateUploadFile(file);
  const ready = file.size <= maxUploadBytes ? file : await prepareUploadFile(file);

  const name = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${fileExtension(ready)}`;
  const path = `${uploadsFolder}/${name}`;
  const { error } = await supabase.storage.from(galleryBucket).upload(path, ready, {
    cacheControl: "3600",
    contentType: ready.type || "image/jpeg",
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
