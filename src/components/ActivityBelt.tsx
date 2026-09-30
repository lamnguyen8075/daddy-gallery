import { useEffect, useRef, useState } from "react";
import type { GalleryItem } from "../data/gallery";
import { fetchActivity, onActivityChange, type ActivityKind, type ActivityRow } from "../lib/bangTin";
import { HeartMark } from "./HeartMark";

type ActivityBeltProps = {
  items: GalleryItem[];
  onSelect: (item: GalleryItem) => void;
};

const TIME_ZONE = "Asia/Ho_Chi_Minh";

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function kindTitle(row: ActivityRow) {
  if (row.kind === "tim") return "Thả tim";
  if (row.kind === "anh") return "Gửi ảnh mới";
  return row.name || "Lời nhắn";
}

function kindBody(row: ActivityRow) {
  if (row.kind === "binh_luan") return row.body;
  return "";
}

function kindTone(kind: ActivityKind) {
  if (kind === "tim") return { chip: "#fff0ee", ink: "#d44536" };
  if (kind === "anh") return { chip: "#eef8f1", ink: "#1d8750" };
  return { chip: "#fff4d6", ink: "#b36f08" };
}

export function ActivityBelt({ items, onSelect }: ActivityBeltProps) {
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ActivityRow[]>([]);

  async function load() {
    setRows(await fetchActivity(items));
  }

  useEffect(() => {
    void load();
    return onActivityChange(() => {
      void load();
    });
  }, [items]);

  useEffect(() => {
    if (!open) return;
    void load();
    function onDoc(event: MouseEvent) {
      if (root.current && !root.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function choose(row: ActivityRow) {
    const item = items.find((entry) => entry.id === row.photoId);
    setOpen(false);
    if (item) onSelect(item);
  }

  const fresh = rows.some((row) => Date.now() - new Date(row.createdAt).getTime() < 24 * 60 * 60 * 1000);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`relative grid h-11 w-11 place-items-center rounded-full ${
          open ? "bg-sand text-ink" : "text-ink-soft"
        }`}
        aria-label="Bảng tin"
        aria-expanded={open}
      >
        <BellMark className="h-6 w-6" />
        {fresh ? (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-script ring-2 ring-[#fff8ef]" />
        ) : null}
      </button>

      {open ? (
        <div className="activity-sheet absolute right-0 top-[calc(100%+0.55rem)] z-40 w-[min(23.5rem,calc(100vw-1.5rem))] overflow-hidden rounded-[28px] max-sm:fixed max-sm:left-3 max-sm:right-3 max-sm:top-[calc(env(safe-area-inset-top)+4.35rem)] max-sm:w-auto">
          <div className="px-5 pb-3 pt-4">
            <p className="font-script text-[22px] leading-none text-ink">Bảng tin</p>
            <p className="mt-1.5 text-[13px] text-ink-soft">Bảy ngày vừa qua</p>
          </div>
          <div className="mx-5 h-px bg-[#f0e0c4]" />
          {rows.length === 0 ? (
            <p className="px-5 py-8 text-center text-ink-soft">Chưa có tin mới.</p>
          ) : (
            <ul className="comment-thread max-h-[min(24rem,58vh)] space-y-0.5 overflow-y-auto overscroll-contain p-2.5 pb-4">
              {rows.map((row) => {
                const item = items.find((entry) => entry.id === row.photoId);
                const tone = kindTone(row.kind);
                const body = kindBody(row);
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => choose(row)}
                      className="flex w-full items-start gap-3 rounded-[22px] px-2.5 py-2.5 text-left hover:bg-[#fff1d6]/60"
                    >
                      <span className="activity-thumb relative mt-0.5 shrink-0 rounded-[16px] p-1">
                        {item ? (
                          <img src={item.image} alt="" className="h-[3.15rem] w-[3.15rem] rounded-[12px] bg-sand object-cover" />
                        ) : (
                          <span className="grid h-[3.15rem] w-[3.15rem] place-items-center rounded-[12px] bg-sand">
                            <KindMark kind={row.kind} />
                          </span>
                        )}
                        <span
                          className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full shadow-[0_4px_10px_rgba(58,42,34,0.12)]"
                          style={{ background: tone.chip, color: tone.ink }}
                        >
                          <KindMark kind={row.kind} />
                        </span>
                      </span>
                      <span className="min-w-0 flex-1 pt-0.5">
                        <span className="block truncate text-[16px] leading-none" style={{ color: tone.ink }}>
                          {kindTitle(row)}
                        </span>
                        {body ? (
                          <span className="mt-1.5 block line-clamp-2 text-[15px] leading-5 text-ink">{body}</span>
                        ) : null}
                        <span className="mt-1.5 block text-[12px] text-ink-soft/80">{formatWhen(row.createdAt)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

function KindMark({ kind }: { kind: ActivityKind }) {
  if (kind === "tim") return <HeartMark className="h-3.5 w-3.5" filled />;
  if (kind === "anh") {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
        <path
          d="M4.6 8.4h3l1.1-1.9h6.6l1.1 1.9H19.4v8.8H4.6Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="13.2" r="2.3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  return <NoteMark className="h-3.5 w-3.5" />;
}

function NoteMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M5 6.2h14v10.2H10.2L5 20.2V6.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BellMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M6 9.2c0-3.3 2.7-6 6-6s6 2.7 6 6c0 6.2 1.8 7.8 1.8 7.8H4.2S6 15.4 6 9.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M10 19.2a2 2 0 0 0 4 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
