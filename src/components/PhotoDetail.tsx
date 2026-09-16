import { useEffect, useState } from "react";
import type { GalleryItem } from "../data/gallery";
import { supabase } from "../lib/supabase";
import { LeafMark } from "./LeafMark";

type PhotoDetailProps = {
  item: GalleryItem;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
};

type Caption = {
  title: string;
  description: string;
};

const fallbackCaption: Caption = {
  title: "Món đồ của nhà",
  description:
    "Một món thủ công Ba làm bằng tay. Để gần gia đình, như những việc giản dị mỗi ngày.",
};

export function PhotoDetail({ item, onClose, onPrev, onNext }: PhotoDetailProps) {
  const [caption, setCaption] = useState<Caption | null>(null);
  const [loading, setLoading] = useState(true);

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
    setLoading(true);
    setCaption(null);

    void (async () => {
      try {
        if (supabase) {
          const { data } = await supabase
            .from("photo_captions")
            .select("title, description")
            .eq("id", item.id)
            .maybeSingle();
          if (!cancelled && data?.title && data.description) {
            setCaption({ title: data.title, description: data.description });
            setLoading(false);
            return;
          }
        }

        const cached = await fetch(`/api/describe?id=${encodeURIComponent(item.id)}`);
        if (cached.ok) {
          const data = (await cached.json()) as Partial<Caption>;
          const next = {
            title: data.title?.trim() ?? "",
            description: data.description?.trim() ?? "",
          };
          if (next.title && next.description && !cancelled) {
            setCaption(next);
            setLoading(false);
            return;
          }
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
        setCaption(next);
      } catch {
        if (!cancelled) setCaption(fallbackCaption);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [item.id, item.image]);

  const title = caption?.title ?? "";
  const description = caption?.description ?? "";

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
        className="absolute left-2 top-[28%] z-20 grid h-11 w-11 place-items-center rounded-full bg-paper/95 text-xl text-ink shadow-lg ring-1 ring-[#f0e0c4] sm:left-3 sm:top-1/2 sm:h-12 sm:w-12 sm:-translate-y-1/2"
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
        className="absolute right-2 top-[28%] z-20 grid h-11 w-11 place-items-center rounded-full bg-paper/95 text-xl text-ink shadow-lg ring-1 ring-[#f0e0c4] sm:right-3 sm:top-1/2 sm:h-12 sm:w-12 sm:-translate-y-1/2"
        aria-label="Ảnh sau"
      >
        →
      </button>

      <article
        className="keepsake-card relative grid h-[100dvh] w-full max-w-[1080px] grid-rows-[auto_1fr] overflow-hidden rounded-none sm:h-auto sm:max-h-[92vh] sm:grid-rows-none sm:rounded-[30px] md:grid-cols-[1.15fr_0.95fr]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-20 grid h-11 w-11 place-items-center rounded-full bg-white/90 text-lg font-semibold text-ink shadow-md ring-1 ring-[#f0e0c4] sm:right-4 sm:top-4 sm:h-10 sm:w-10"
          aria-label="Đóng"
        >
          ×
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
          <div className="flex items-center gap-3">
            <LeafMark className="h-8 w-8 sm:h-9 sm:w-9" />
            <p className="font-hand text-[20px] leading-none text-script sm:text-[24px]">Thủ công của Ba</p>
          </div>

          {loading ? (
            <div className="mt-6 space-y-4">
              <div className="h-9 w-4/5 animate-pulse rounded-lg bg-sand" />
              <div className="h-4 w-24 animate-pulse rounded bg-sand-deep/80" />
              <div className="mt-8 space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-sand" />
                <div className="h-4 w-[92%] animate-pulse rounded bg-sand" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-sand" />
              </div>
              <p className="font-serif text-sm italic text-ink-soft">Đang xem món này...</p>
            </div>
          ) : (
            <>
              <h2 className="font-display mt-4 text-[26px] leading-tight text-ink sm:mt-5 sm:text-[38px]">
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
            </>
          )}

          <p className="font-script mt-auto pt-6 text-[24px] leading-none text-ink sm:mt-8 sm:text-[30px]">
            Phòng tranh của Ba
          </p>
        </div>
      </article>
    </div>
  );
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
