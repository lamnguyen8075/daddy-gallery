export type MapPoint = { lat: number; lng: number };

const memory = new Map<string, MapPoint | null>();
const storageKey = "daddy-gallery-place-coords";

function readStored(): Record<string, MapPoint | null> {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, MapPoint | null>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStored(label: string, point: MapPoint | null) {
  const stored = readStored();
  stored[label] = point;
  localStorage.setItem(storageKey, JSON.stringify(stored));
}

export async function geocodePlace(label: string): Promise<MapPoint | null> {
  if (memory.has(label)) return memory.get(label) ?? null;
  const stored = readStored();
  if (Object.prototype.hasOwnProperty.call(stored, label)) {
    memory.set(label, stored[label]);
    return stored[label];
  }

  try {
    const response = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(label)}&limit=1`,
    );
    if (!response.ok) throw new Error(String(response.status));
    const body = (await response.json()) as {
      features?: { geometry?: { coordinates?: number[] } }[];
    };
    const coords = body.features?.[0]?.geometry?.coordinates;
    const point =
      coords && coords.length >= 2 && Number.isFinite(coords[0]) && Number.isFinite(coords[1])
        ? { lng: coords[0], lat: coords[1] }
        : null;
    memory.set(label, point);
    writeStored(label, point);
    return point;
  } catch {
    memory.set(label, null);
    return null;
  }
}
