import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { geocodePlace } from "../lib/geocodePlace";

type Place = { label: string; count: number };

function pinIcon(count: number) {
  return L.divIcon({
    className: "location-pin",
    html: `<span>${count}</span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const marks: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return marks[char];
  });
}

export function LocationMap({ places }: { places: Place[] }) {
  const host = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const fittedRef = useRef(false);
  const placesRef = useRef(places);
  const [status, setStatus] = useState<"loading" | "ready" | "empty">("loading");
  const [missed, setMissed] = useState<string[]>([]);
  const signature = places.map((place) => `${place.label}:${place.count}`).join("|");
  placesRef.current = places;

  useEffect(() => {
    const node = host.current;
    const places = placesRef.current;
    if (!node) return;
    if (!mapRef.current) {
      const map = L.map(node, {
        dragging: true,
        touchZoom: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: false,
        keyboard: true,
        zoomControl: true,
        minZoom: 2,
        maxZoom: 16,
      }).setView([16, 107], 2);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 16,
      }).addTo(map);
      mapRef.current = map;
      const observer = new ResizeObserver(() => map.invalidateSize());
      observer.observe(node);
      map.on("unload", () => observer.disconnect());
    }

    const map = mapRef.current;
    const layer = L.layerGroup().addTo(map);
    let cancelled = false;
    setStatus("loading");

    void (async () => {
      const pins = (
        await Promise.all(
          places.map(async (place) => {
            const point = await geocodePlace(place.label);
            return point ? { ...place, ...point } : null;
          }),
        )
      ).filter((pin) => pin !== null);
      if (cancelled) return;

      for (const pin of pins) {
        L.marker([pin.lat, pin.lng], { icon: pinIcon(pin.count) })
          .bindPopup(
            `<strong>${escapeHtml(pin.label)}</strong><br>${pin.count} lượt`,
          )
          .addTo(layer);
      }

      map.invalidateSize();
      if (!fittedRef.current && pins.length > 0) {
        const frame = window.requestAnimationFrame(() => {
          if (cancelled || fittedRef.current) return;
          fittedRef.current = true;
          map.invalidateSize();
          if (pins.length === 1) {
            map.setView([pins[0].lat, pins[0].lng], 6);
          } else {
            map.fitBounds(
              L.latLngBounds(pins.map((pin) => [pin.lat, pin.lng])),
              { paddingTopLeft: [64, 48], paddingBottomRight: [28, 48], maxZoom: 5 },
            );
          }
        });
        map.once("unload", () => window.cancelAnimationFrame(frame));
      }
      setMissed(places.filter((place) => !pins.some((pin) => pin.label === place.label)).map((place) => place.label));
      setStatus(pins.length ? "ready" : "empty");
    })();

    return () => {
      cancelled = true;
      layer.remove();
    };
  }, [signature]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="mt-4">
      <div className="relative h-[22rem] overflow-hidden rounded-2xl ring-1 ring-[#f0e0c4] sm:h-80">
        <div ref={host} className="location-map h-full w-full" />
        {status === "loading" ? (
          <p className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-white/90 px-3 py-1 text-[12px] text-ink-soft">
            Đang gắn vị trí…
          </p>
        ) : null}
      </div>
      <p className="mt-2 text-[13px] leading-5 text-ink-soft">
        Kéo để xem. Chụm hai ngón, hoặc bấm + và −, để phóng.
      </p>
      {status === "empty" ? (
        <p className="mt-3 text-sm text-ink-soft">Không gắn được các vị trí này lên bản đồ.</p>
      ) : null}
      {missed.length > 0 && status === "ready" ? (
        <p className="mt-3 text-sm text-ink-soft">Chưa gắn được: {missed.join(", ")}</p>
      ) : null}
    </div>
  );
}
