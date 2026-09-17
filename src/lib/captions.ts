export const captionsFolder = "captions";

export function captionObjectPath(id: string) {
  return `${captionsFolder}/${id.replace(/[^a-zA-Z0-9._-]/g, "_")}.json`;
}
