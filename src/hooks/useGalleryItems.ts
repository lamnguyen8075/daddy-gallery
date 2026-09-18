import { useCallback, useEffect, useState } from "react";
import type { GalleryItem } from "../data/gallery";
import { prefetchStoredCaptions } from "../lib/captionStore";
import { fetchGalleryItems } from "../lib/gallery";

export function useGalleryItems() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => {
    setNonce((value) => value + 1);
  }, []);

  const addItem = useCallback((item: GalleryItem) => {
    setItems((current) => [item, ...current.filter((entry) => entry.id !== item.id)]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((entry) => entry.id !== id));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const silent = nonce > 0;

    async function load() {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const next = await fetchGalleryItems();
        if (!cancelled) {
          setItems(next);
          void prefetchStoredCaptions();
        }
      } catch (caught) {
        if (!cancelled && !silent) {
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
  }, [nonce]);

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) reload();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [reload]);

  return { items, loading, error, reload, addItem, removeItem };
}
