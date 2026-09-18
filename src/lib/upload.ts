import type { GalleryItem } from "../data/gallery";
import { isImageFile } from "../data/gallery";
import { captionObjectPath } from "./captions";
import { galleryBucket, isSupabaseConfigured, supabase } from "./supabase";

export const uploadsFolder = "uploads";
export const maxUploadBytes = 2 * 1024 * 1024;

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

  const bitmap = await readBitmap(file);
  const edges = [2048, 1600, 1280, 1024, 800, 640, 480, 320];
  const qualities = [0.86, 0.74, 0.62, 0.5, 0.38, 0.26];

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
  const ready = file.type === "image/jpeg" && file.size <= maxUploadBytes ? file : await prepareUploadFile(file);

  const name = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.jpg`;
  const path = `${uploadsFolder}/${name}`;
  const { error } = await supabase.storage.from(galleryBucket).upload(path, ready, {
    cacheControl: "3600",
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) {
    throw new Error(
      /row-level security|policy|not allowed/i.test(error.message)
        ? "Chưa mở quyền gửi ảnh. Trong SQL editor, chạy file supabase/uploads.sql."
        : /exceeded the maximum allowed size|payload too large|too large/i.test(error.message)
          ? "Ảnh vẫn lớn hơn giới hạn kho. Thử chọn ảnh khác."
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

  const paths = [...new Set([item.path, captionObjectPath(item.id), captionObjectPath(item.path)])];
  const { data, error } = await supabase.storage.from(galleryBucket).remove(paths);
  if (error) {
    throw new Error(
      /row-level security|policy|not allowed|access denied/i.test(error.message)
        ? "Chưa mở quyền xóa ảnh. Trong SQL editor, chạy file supabase/uploads.sql."
        : error.message,
    );
  }

  const removed = new Set((data ?? []).map((file) => file.name));
  if (!removed.has(item.path)) {
    throw new Error("Chưa mở quyền xóa ảnh. Trong SQL editor, chạy file supabase/uploads.sql.");
  }
}
