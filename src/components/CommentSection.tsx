import { useEffect, useState, type FormEvent } from "react";
import { addComment, fetchComments, maxBody, type CommentRow } from "../lib/binhLuan";

const TIME_ZONE = "Asia/Ho_Chi_Minh";

const palettes = [
  { name: "#d44536", ring: "#e85d4c", bubble: "#fff4e8" },
  { name: "#1d8750", ring: "#2f9e5a", bubble: "#eef8f1" },
  { name: "#b36f08", ring: "#f0b429", bubble: "#fff4d6" },
  { name: "#2b7aa8", ring: "#7ebfdd", bubble: "#e8f4fb" },
  { name: "#c24f86", ring: "#e59ab3", bubble: "#ffeff5" },
] as const;

type CommentSectionProps = {
  photoId: string;
};

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function errorText(caught: unknown) {
  if (caught instanceof Error && caught.message) return caught.message;
  if (caught && typeof caught === "object" && "message" in caught) {
    return String((caught as { message: unknown }).message);
  }
  return "Không đọc được lời nhắn.";
}

function hashName(name: string) {
  let n = 0;
  for (const ch of name) n = (n * 33 + ch.charCodeAt(0)) >>> 0;
  return n;
}

function paletteFor(name: string) {
  return palettes[hashName(name) % palettes.length];
}

function faceKind(name: string) {
  const n = name.toLowerCase();
  if (n.includes("cáo")) return "fox";
  if (n.includes("heo")) return "pig";
  if (n.includes("mèo")) return "cat";
  if (n.includes("gấu")) return "bear";
  if (n.includes("cánh cụt") || n.includes("cụt")) return "penguin";
  if (n.includes("cá")) return "fish";
  if (n.includes("sóc")) return "squirrel";
  if (n.includes("thỏ")) return "bunny";
  if (n.includes("gà")) return "chick";
  if (n.includes("ếch")) return "frog";
  if (n.includes("ong")) return "bee";
  if (n.includes("vịt")) return "duck";
  if (n.includes("nhím")) return "hedgehog";
  if (n.includes("rái")) return "otter";
  if (n.includes("chó")) return "dog";
  if (n.includes("bướm")) return "butterfly";
  return "flower";
}

export function CommentSection({ photoId }: CommentSectionProps) {
  const [rows, setRows] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setRows([]);
    void fetchComments(photoId)
      .then((next) => {
        if (cancelled) return;
        setRows(next);
        setLoading(false);
      })
      .catch((caught) => {
        if (cancelled) return;
        const message = errorText(caught);
        const missing = /schema cache|does not exist|binh_luan|PGRST205/i.test(message);
        setError(
          missing
            ? "Chưa mở bình luận. Trong SQL editor, chạy file supabase/binh_luan.sql."
            : message,
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [photoId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setError(null);
    try {
      const next = await addComment(photoId, body);
      setRows((current) => [next, ...current]);
      setBody("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không gửi được lời nhắn.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-[#f0e0c4]" />
        <h3 className="flex items-center gap-1.5 text-[12px] tracking-[0.22em] text-ink-soft">
          LỜI NHẮN{rows.length ? ` · ${rows.length}` : ""}
        </h3>
        <span className="h-px flex-1 bg-[#f0e0c4]" />
      </div>

      <form
        className="comment-composer mb-4 flex items-end gap-2 p-1.5"
        onSubmit={(event) => void submit(event)}
      >
        <textarea
          value={body}
          maxLength={maxBody}
          rows={2}
          required
          placeholder="Chia sẻ cảm nghĩ"
          onChange={(event) => setBody(event.target.value)}
          className="min-h-11 w-full flex-1 resize-none rounded-[20px] bg-transparent px-3.5 py-2.5 leading-6 text-ink outline-none placeholder:text-ink-soft/65"
        />
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="mb-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-leaf text-white shadow-[0_6px_14px_rgba(47,158,90,0.28)] disabled:opacity-40"
          aria-label={sending ? "Đang gửi..." : "Gửi lời nhắn"}
        >
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
            <path
              d="M5 12h10.5M13 7.5 18.5 12 13 16.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </form>

      {error ? <p className="mb-3 text-sm text-script">{error}</p> : null}

      {loading ? (
        <p className="text-sm italic text-ink-soft">Đang tải lời nhắn...</p>
      ) : rows.length > 0 ? (
        <div className="comment-thread max-h-[min(22rem,44vh)] space-y-4 overflow-y-auto overscroll-contain py-1 pr-1">
          {rows.map((row) => {
            const tone = paletteFor(row.name);
            return (
              <article key={row.id} className="flex items-start gap-2.5">
                <span
                  className="comment-face mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full"
                  style={{ color: tone.ring, boxShadow: `0 0 0 1.5px ${tone.ring}` }}
                  aria-hidden="true"
                >
                  <GuestFace kind={faceKind(row.name)} />
                </span>
                <div className="min-w-0 flex-1 pb-1">
                  <div className="mb-1.5 flex items-baseline gap-2 pl-1">
                    <p className="truncate text-[16px] leading-none" style={{ color: tone.name }}>
                      {row.name}
                    </p>
                    <p className="shrink-0 text-[11px] text-ink-soft/75">{formatWhen(row.createdAt)}</p>
                  </div>
                  <div
                    className="comment-cloud text-[15px] leading-6 text-ink"
                    style={{ ["--bubble" as string]: tone.bubble }}
                  >
                    <p className="whitespace-pre-wrap">{row.body}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function GuestFace({ kind }: { kind: ReturnType<typeof faceKind> }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (kind === "fox") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5">
        <path d="M5 10 8 5l4 3 4-3 3 5-7 8z" {...common} />
        <circle cx="10" cy="12" r=".7" fill="currentColor" />
        <circle cx="14" cy="12" r=".7" fill="currentColor" />
      </svg>
    );
  }
  if (kind === "cat") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5">
        <path d="M6 11c0-4 3-7 6-7s6 3 6 7-3 8-6 8-6-4-6-8Z" {...common} />
        <path d="M8 6 6 3M16 6l2-3M9 13h6" {...common} />
      </svg>
    );
  }
  if (kind === "bear") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5">
        <circle cx="7.5" cy="8" r="2.2" {...common} />
        <circle cx="16.5" cy="8" r="2.2" {...common} />
        <circle cx="12" cy="13" r="5.2" {...common} />
        <circle cx="12" cy="14.2" r="1.4" {...common} />
      </svg>
    );
  }
  if (kind === "penguin") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5">
        <ellipse cx="12" cy="13" rx="5" ry="6.5" {...common} />
        <ellipse cx="12" cy="14" rx="2.4" ry="3.4" {...common} />
        <path d="M10 8.5h4" {...common} />
      </svg>
    );
  }
  if (kind === "pig") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5">
        <circle cx="12" cy="13" r="5.5" {...common} />
        <ellipse cx="12" cy="14.5" rx="2.2" ry="1.5" {...common} />
        <path d="M8 8.5 6.5 6M16 8.5 17.5 6" {...common} />
      </svg>
    );
  }
  if (kind === "bunny") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5">
        <path d="M9 11c0-5 1.2-8 2.2-8S13 7 12.6 11M15 11c0-5-1.2-8-2.2-8S11 7 11.4 11" {...common} />
        <circle cx="12" cy="14.5" r="4.2" {...common} />
      </svg>
    );
  }
  if (kind === "fish") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5">
        <path d="M4 12c4-5 12-5 14 0-2 5-10 5-14 0Z" {...common} />
        <path d="M18 12 21 8.5v7Z" {...common} />
        <circle cx="8.5" cy="11.5" r=".7" fill="currentColor" />
      </svg>
    );
  }
  if (kind === "bee") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5">
        <ellipse cx="12" cy="13" rx="4.2" ry="5" {...common} />
        <path d="M9.5 11h5M9.5 14h5M8 9c-2-3 0-5 2-4M16 9c2-3 0-5-2-4" {...common} />
      </svg>
    );
  }
  if (kind === "butterfly") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5">
        <path d="M12 7v11M8 9c-4 0-5 5-2 6 3 0 5-2 6-4 1 2 3 4 6 4 3-1 2-6-2-6-2 0-3.5 1.5-4 3-.5-1.5-2-3-4-3Z" {...common} />
      </svg>
    );
  }
  if (kind === "chick") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5">
        <circle cx="12" cy="13" r="5.2" {...common} />
        <path d="M12 8 10.5 5.5h3Z" {...common} />
        <circle cx="10.5" cy="12.5" r=".6" fill="currentColor" />
      </svg>
    );
  }
  if (kind === "frog") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5">
        <path d="M6 14c0-4 3-7 6-7s6 3 6 7-2.5 6-6 6-6-2-6-6Z" {...common} />
        <circle cx="9.2" cy="11" r="1.3" {...common} />
        <circle cx="14.8" cy="11" r="1.3" {...common} />
      </svg>
    );
  }
  if (kind === "duck") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5">
        <circle cx="10" cy="10" r="3.2" {...common} />
        <path d="M12.8 10.2h4.4c.8 0 .8 2.4 0 2.4H14M7 13.5c1 5 9 5 10 0" {...common} />
      </svg>
    );
  }
  if (kind === "dog") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5">
        <path d="M7 9.5 5 6.5 8 8.5M17 9.5 19 6.5 16 8.5" {...common} />
        <circle cx="12" cy="13" r="5" {...common} />
        <path d="M10 15.2h4" {...common} />
      </svg>
    );
  }
  if (kind === "squirrel" || kind === "otter" || kind === "hedgehog") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5">
        <circle cx="12" cy="13" r="5.2" {...common} />
        <path d="M8 9 6.5 6.5M16 9l1.5-2.5M9.5 14.5h5" {...common} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path
        d="M12 19c-2.2-2.4-7-5.2-7-9.2A4 4 0 0 1 12 7a4 4 0 0 1 7 2.8c0 4-4.8 6.8-7 9.2Z"
        {...common}
      />
      <circle cx="12" cy="10.5" r="1.2" fill="currentColor" />
    </svg>
  );
}
