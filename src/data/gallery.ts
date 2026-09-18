export const categories = [
  "All",
  "Crafts",
  "Paintings",
  "Holiday",
  "Plants",
] as const;

export type Category = (typeof categories)[number];
export type PhotoCategory = Exclude<Category, "All">;
export type PhotoAspect = "portrait" | "square" | "landscape";

export type GalleryItem = {
  id: string;
  path: string;
  title: string;
  category: PhotoCategory;
  image: string;
  maker: string;
  year: string;
  memory: string;
  aspect: PhotoAspect;
};

const folderToCategory: Record<string, PhotoCategory> = {
  crafts: "Crafts",
  craft: "Crafts",
  handmade: "Crafts",
  paintings: "Paintings",
  painting: "Paintings",
  holiday: "Holiday",
  christmas: "Holiday",
  plants: "Plants",
  plant: "Plants",
  uploads: "Crafts",
  upload: "Crafts",
};

export function categoryFromFolder(folder: string): PhotoCategory {
  return folderToCategory[folder.trim().toLowerCase()] ?? "Crafts";
}

export function isImageFile(name: string) {
  return /\.(jpe?g|png|webp|gif|avif|heic)$/i.test(name);
}
