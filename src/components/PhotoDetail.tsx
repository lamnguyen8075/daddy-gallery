import { useEffect, useRef, useState, type TouchEvent } from "react";
import type { GalleryItem } from "../data/gallery";
import {
  fetchStoredCaption,
  getCachedCaption,
  setCachedCaption,
} from "../lib/captionStore";

type PhotoDetailProps = {
  item: GalleryItem;
  admin?: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onDelete?: (item: GalleryItem) => Promise<void> | void;
};

type Caption = {
  title: string;
  description: string;
};

const fallbackCaption: Caption = {
  title: "Món đồ của nhà",
  description:
    "Một món thủ công làm bằng tay. Xem cho vui, như trong phòng trưng bày.",
};

export function PhotoDetail({ item, admin = false, onClose, onPrev, onNext, onDelete }: PhotoDetailProps) {
  const [caption, setCaption] = useState<Caption | null>(() => getCachedCaption(item.id));
  const [captionId, setCaptionId] = useState(item.id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const shown = getCachedCaption(item.id) ?? (captionId === item.id ? caption : null);
  const loading = !shown;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onPrev();
      if (event.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, onPrev, onNext]);

  useEffect(() => {
    let cancelled = false;
    const cached = getCachedCaption(item.id);
    if (cached) {
      setCaption(cached);
      setCaptionId(item.id);
      return;
    }

    setCaption(null);
    setCaptionId(item.id);
    setConfirmDelete(false);
    setDeleteError(null);

    void (async () => {
      try {
        const stored = await fetchStoredCaption(item.id);
        if (cancelled) return;
        if (stored) {
          setCaption(stored);
          setCaptionId(item.id);
          return;
        }

        const response = await fetch("/api/describe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id, image: item.image }),
        });
        if (!response.ok) throw new Error("describe failed");
        const data = (await response.json()) as Partial<Caption>;
        const next = {
          title: data.title?.trim() ?? "",
          description: data.description?.trim() ?? "",
        };
        if (!next.title || !next.description || cancelled) return;
        setCachedCaption(item.id, next);
        setCaption(next);
        setCaptionId(item.id);
      } catch {
        if (!cancelled) {
          setCaption(fallbackCaption);
          setCaptionId(item.id);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [item.id, item.image]);

  const title = shown?.title ?? "";
  const description = shown?.description ?? "";
  const swipe = useSwipeNav(onPrev, onNext);

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-[#3a2a22]/50 p-0 backdrop-blur-[3px] sm:items-center sm:p-6"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onPrev();
        }}
        className="absolute left-2 top-[28%] z-20 grid h-12 w-12 place-items-center rounded-full bg-paper text-2xl text-ink shadow-lg ring-2 ring-white sm:left-3 sm:top-1/2 sm:h-12 sm:w-12 sm:-translate-y-1/2"
        aria-label="Ảnh trước"
      >
        ←
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onNext();
        }}
        className="absolute right-2 top-[28%] z-20 grid h-12 w-12 place-items-center rounded-full bg-paper text-2xl text-ink shadow-lg ring-2 ring-white sm:right-3 sm:top-1/2 sm:h-12 sm:w-12 sm:-translate-y-1/2"
        aria-label="Ảnh sau"
      >
        →
      </button>

      <article
        className="keepsake-card relative grid h-[100dvh] w-full max-w-[1080px] grid-rows-[auto_1fr] overflow-hidden rounded-none sm:h-auto sm:max-h-[92vh] sm:grid-rows-none sm:rounded-[30px] md:grid-cols-[1.15fr_0.95fr]"
        onClick={(event) => event.stopPropagation()}
        onTouchStart={swipe.onTouchStart}
        onTouchEnd={swipe.onTouchEnd}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-30 grid h-12 w-12 place-items-center rounded-full bg-paper shadow-[0_8px_22px_rgba(58,42,34,0.2)] ring-2 ring-[#f0b429]/80 sm:right-4 sm:top-4"
          aria-label="Đóng"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              fill="none"
              stroke="#e85d4c"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="photo-mat relative min-h-[220px] p-4 sm:p-7 md:min-h-[560px]">
          <span className="washi-gold absolute left-6 top-3 z-10 h-3.5 w-20 rotate-[-9deg] rounded-sm shadow-sm sm:left-8 sm:top-4 sm:h-4 sm:w-24" />
          <span className="washi-sky absolute right-8 top-5 z-10 h-3 w-14 rotate-[11deg] rounded-sm shadow-sm sm:right-10 sm:top-6 sm:h-3.5 sm:w-16" />
          <div className="relative h-full overflow-hidden rounded-[18px] bg-paper shadow-[inset_0_0_0_1px_rgba(58,42,34,0.06)] ring-1 ring-[#ead9b8] sm:rounded-[22px]">
            <img
              src={item.image}
              alt={title || "Ảnh thủ công"}
              className="h-full max-h-[38dvh] w-full object-contain md:absolute md:inset-0 md:max-h-none"
            />
          </div>
        </div>

        <div className="caption-wash relative flex min-h-0 flex-1 flex-col overflow-y-auto p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:p-8 md:max-h-[92vh] md:min-h-[560px]">
          <CornerFlourish className="pointer-events-none absolute right-4 top-4 h-12 w-12 text-gold/70 sm:right-5 sm:top-5 sm:h-16 sm:w-16" />

          {loading ? (
            <div className="mt-1 space-y-4 pr-14">
              <div className="h-9 w-4/5 animate-pulse rounded-lg bg-sand" />
              <div className="h-4 w-24 animate-pulse rounded bg-sand-deep/80" />
              <div className="mt-8 space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-sand" />
                <div className="h-4 w-[92%] animate-pulse rounded bg-sand" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-sand" />
              </div>
              <p className="font-serif text-sm italic text-ink-soft">
                Tải nội dung
              </p>
            </div>
          ) : (
            <>
              <h2 className="font-display pr-14 text-[26px] leading-tight text-ink sm:text-[38px]">
                {title}
              </h2>
              {item.year ? (
                <p className="mt-2 font-serif text-base italic text-ink-soft sm:mt-3 sm:text-lg">{item.year}</p>
              ) : null}
              <div className="my-5 flex items-center gap-3 sm:my-6">
                <span className="h-px flex-1 bg-[#f0e0c4]" />
                <span className="text-script">♡</span>
                <span className="h-px flex-1 bg-[#f0e0c4]" />
              </div>
              <p className="font-serif text-[17px] leading-7 text-ink sm:text-[19px] sm:leading-8">{description}</p>
              {admin && onDelete ? (
                <div className="mt-8">
                  {confirmDelete ? (
                    <div className="rounded-2xl bg-sand px-4 py-4">
                      <p className="text-ink">Xóa ảnh này khỏi phòng tranh?</p>
                      {deleteError ? <p className="mt-2 text-sm text-script">{deleteError}</p> : null}
                      <div className="mt-4 flex gap-3">
                        <button
                          type="button"
                          disabled={deleting}
                          onClick={() => setConfirmDelete(false)}
                          className="min-h-12 flex-1 rounded-full bg-paper text-ink-soft"
                        >
                          Không
                        </button>
                        <button
                          type="button"
                          disabled={deleting}
                          onClick={() => {
                            setDeleting(true);
                            setDeleteError(null);
                            void Promise.resolve(onDelete(item))
                              .catch((caught) => {
                                setDeleteError(caught instanceof Error ? caught.message : "Không xóa được.");
                              })
                              .finally(() => setDeleting(false));
                          }}
                          className="min-h-12 flex-1 rounded-full bg-script text-white"
                        >
                          {deleting ? "Đang xóa..." : "Xóa"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="min-h-12 w-full rounded-full border border-[#f0e0c4] bg-paper px-6 text-script sm:w-auto"
                    >
                      Xóa ảnh
                    </button>
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>
      </article>
    </div>
  );
}

function useSwipeNav(onPrev: () => void, onNext: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);

  return {
    onTouchStart(event: TouchEvent) {
      const touch = event.changedTouches[0];
      start.current = { x: touch.clientX, y: touch.clientY };
    },
    onTouchEnd(event: TouchEvent) {
      if (!start.current) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.current.x;
      const dy = touch.clientY - start.current.y;
      start.current = null;
      if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
      if (dx < 0) onNext();
      else onPrev();
    },
  };
}

function CornerFlourish({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <path
        d="M8 12c18 2 32 16 36 36"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M14 8c4 10 14 20 28 24"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.7"
      />
      <circle cx="46" cy="50" r="2.2" fill="currentColor" opacity="0.8" />
    </svg>
  );
}
