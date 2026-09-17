import { useEffect, useState } from "react";
import type { GalleryItem } from "../data/gallery";
import { prefetchStoredCaptions } from "../lib/captionStore";
import { fetchGalleryItems } from "../lib/gallery";

export function useGalleryItems() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const next = await fetchGalleryItems();
        if (!cancelled) {
          setItems(next);
          void prefetchStoredCaptions();
        }
      } catch (caught) {
        if (!cancelled) {
          setItems([]);
          setError(caught instanceof Error ? caught.message : "Could not load the gallery.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { items, loading, error };
}
