import type { PhotoCaption } from "./captionStore";
import { supabase } from "./supabase";

function asCaption(data: unknown): PhotoCaption | null {
  if (!data || typeof data !== "object") return null;
  const title = "title" in data && typeof data.title === "string" ? data.title.trim() : "";
  const description =
    "description" in data && typeof data.description === "string" ? data.description.trim() : "";
  if (!title || !description) return null;
  return { title, description };
}

async function describeViaVite(id: string, image: string): Promise<PhotoCaption | null> {
  try {
    const response = await fetch("/api/describe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, image }),
    });
    if (!response.ok) return null;
    return asCaption(await response.json());
  } catch {
    return null;
  }
}

async function describeViaFunction(id: string, image: string): Promise<PhotoCaption | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.functions.invoke("describe", {
    body: { id, image },
  });
  if (error) return null;
  return asCaption(data);
}

export async function generateCaption(id: string, image: string): Promise<PhotoCaption | null> {
  return (await describeViaVite(id, image)) ?? describeViaFunction(id, image);
}
