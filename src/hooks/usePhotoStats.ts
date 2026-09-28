import { useCallback, useEffect, useState } from "react";
import {
  addHeart as persistHeart,
  addView as persistView,
  fetchPhotoCounts,
  type CountsMap,
} from "../lib/anhDem";

export type { CountsMap };

const empty = { hearts: 0, views: 0 };

export function usePhotoStats() {
  const [counts, setCounts] = useState<CountsMap>({});

  const reload = useCallback(async () => {
    setCounts(await fetchPhotoCounts());
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addHeart = useCallback(async (photoId: string) => {
    setCounts((current) => {
      const now = current[photoId] ?? empty;
      return { ...current, [photoId]: { ...now, hearts: now.hearts + 1 } };
    });
    const next = await persistHeart(photoId);
    if (next == null) return;
    setCounts((current) => {
      const now = current[photoId] ?? empty;
      return { ...current, [photoId]: { ...now, hearts: next } };
    });
  }, []);

  const addView = useCallback(async (photoId: string) => {
    const next = await persistView(photoId);
    if (next == null) return;
    setCounts((current) => {
      const now = current[photoId] ?? empty;
      return { ...current, [photoId]: { ...now, views: next } };
    });
  }, []);

  return { counts, addHeart, addView, reload };
}

export function countFor(counts: CountsMap, photoId: string) {
  return counts[photoId] ?? empty;
}
