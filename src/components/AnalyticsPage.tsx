import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { GalleryItem } from "../data/gallery";
import { fetchClicks, type ClickRow } from "../lib/clicks";

const TIME_ZONE = "Asia/Ho_Chi_Minh";
const DAY_COUNT = 14;

type AnalyticsPageProps = {
  items: GalleryItem[];
};

const kindColors: Record<string, string> = {
  photo: "bg-leaf",
  cta: "bg-script",
  nav: "bg-gold",
};

function dayKey(iso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: TIME_ZONE,
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(iso));
}

function formatDayLabel(key: string) {
  const [, month, day] = key.split("-");
  return `${day}/${month}`;
}

function todayKey() {
  return dayKey(new Date().toISOString());
}

function lastDays(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.now() - (count - 1 - index) * 24 * 60 * 60 * 1000);
    return dayKey(date.toISOString());
  });
}

function clickLabel(row: ClickRow, items: GalleryItem[]) {
  if (row.kind === "cta") return "Xem tác phẩm";
  if (row.kind === "nav") {
    if (row.target === "home") return "Trang chủ";
    if (row.target === "gallery") return "Tác phẩm";
    if (row.target === "about") return "Giới thiệu";
  }
  if (row.kind === "photo") {
    const item = items.find((entry) => entry.id === row.target);
    return item?.title || row.target || "Ảnh";
  }
  return [row.kind, row.target].filter(Boolean).join(" · ");
}

export function AnalyticsPage({ items }: AnalyticsPageProps) {
  const [rows, setRows] = useState<ClickRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(silent = false) {
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const result = await fetchClicks();
      setRows(result.rows);
      setTotal(result.total);
      setError(null);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Không đọc được lượt bấm.";
      setError(message);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(true), 4000);
    return () => window.clearInterval(timer);
  }, []);

  const days = useMemo(() => lastDays(DAY_COUNT), []);
  const byDay = useMemo(() => {
    const counts = new Map(days.map((day) => [day, 0]));
    for (const row of rows) {
      const key = dayKey(row.created_at);
      if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return days.map((day) => ({ day, count: counts.get(day) ?? 0 }));
  }, [days, rows]);

  const byLabel = useMemo(() => {
    const counts = new Map<string, { kind: string; count: number }>();
    for (const row of rows) {
      const label = clickLabel(row, items);
      const current = counts.get(label);
      counts.set(label, { kind: row.kind, count: (current?.count ?? 0) + 1 });
    }
    return [...counts.entries()]
      .map(([label, value]) => ({ label, ...value }))
      .sort((a, b) => b.count - a.count);
  }, [items, rows]);

  const byLocation = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows) {
      const label = row.location || "Chưa rõ nơi";
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }, [rows]);

  const maxDay = Math.max(1, ...byDay.map((entry) => entry.count));
  const maxLabel = Math.max(1, ...byLabel.map((entry) => entry.count));
  const maxLocation = Math.max(1, ...byLocation.map((entry) => entry.count));
  const todayCount = byDay.find((entry) => entry.day === todayKey())?.count ?? 0;
  const photoCount = rows.filter((row) => row.kind === "photo").length;

  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-5 sm:py-16 lg:px-8">
        <p className="text-[12px] tracking-[0.22em] text-ink-soft">NHẬT KÝ</p>
        <div className="mt-3 flex items-end justify-between gap-4">
          <h1 className="font-display text-3xl text-ink sm:text-5xl">Lượt bấm</h1>
          <button
            type="button"
            onClick={() => void load()}
            className="min-h-11 rounded-full border border-[#f0e0c4] bg-paper px-4 text-sm text-ink-soft"
          >
            Làm mới
          </button>
        </div>

        {error ? (
          <p className="mt-8 rounded-2xl bg-sand px-4 py-5 text-ink-soft">
            Chưa đọc được nhật ký. Trong SQL editor, chạy file{" "}
            <span className="text-ink">supabase/nhatky.sql</span>
            {error ? ` (${error})` : ""}.
          </p>
        ) : null}

        <div className="mt-8 grid grid-cols-3 gap-3">
          <Stat label="Tổng" value={loading ? "…" : String(total)} />
          <Stat label="Hôm nay" value={loading ? "…" : String(todayCount)} />
          <Stat label="Ảnh" value={loading ? "…" : String(photoCount)} />
        </div>

        <div className="mt-8 rounded-3xl bg-paper px-4 py-5 shadow-[0_0_0_1px_rgba(240,224,196,0.95)] sm:px-6">
          <p className="text-sm text-ink-soft">14 ngày gần đây</p>
          {total === 0 ? (
            <p className="mt-4 text-ink-soft">
              Chưa ghi được lượt bấm. Bấm một ảnh hoặc nút menu, chờ vài giây.
            </p>
          ) : (
            <div className="mt-5 flex h-44 items-end gap-1.5 sm:gap-2">
              {byDay.map((entry) => (
                <div key={entry.day} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] text-ink">{entry.count || ""}</span>
                  <div className="flex h-32 w-full items-end">
                    <div
                      className="w-full rounded-t-md bg-leaf"
                      style={{
                        height: entry.count ? `${Math.max(10, (entry.count / maxDay) * 100)}%` : "2px",
                        opacity: entry.count ? 1 : 0.25,
                      }}
                      title={`${formatDayLabel(entry.day)}: ${entry.count}`}
                    />
                  </div>
                  <span className="text-[10px] text-ink-soft sm:text-[11px]">
                    {formatDayLabel(entry.day)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 rounded-3xl bg-paper px-4 py-5 shadow-[0_0_0_1px_rgba(240,224,196,0.95)] sm:px-6">
          <p className="text-sm text-ink-soft">Theo vị trí</p>
          {byLocation.length === 0 ? (
            <p className="mt-4 text-ink-soft">Chưa có vị trí nào ghi nhận.</p>
          ) : (
            <ScrollList>
              <ul className="space-y-3">
                {byLocation.map((entry) => (
                  <li key={entry.label}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate text-ink">{entry.label}</span>
                      <span className="shrink-0 text-ink-soft">{entry.count}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-sand">
                      <div
                        className="h-full rounded-full bg-sky"
                        style={{ width: `${(entry.count / maxLocation) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollList>
          )}
        </div>

        <div className="mt-8 rounded-3xl bg-paper px-4 py-5 shadow-[0_0_0_1px_rgba(240,224,196,0.95)] sm:px-6">
          <p className="text-sm text-ink-soft">Theo chỗ bấm</p>
          {byLabel.length === 0 ? (
            <p className="mt-4 text-ink-soft">
              Chưa có lượt bấm. Vào trang chủ, bấm vài chỗ, rồi bấm Làm mới.
            </p>
          ) : (
            <ScrollList>
              <ul className="space-y-3">
                {byLabel.map((entry) => (
                  <li key={entry.label}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="truncate text-ink">{entry.label}</span>
                      <span className="shrink-0 text-ink-soft">{entry.count}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-sand">
                      <div
                        className={`h-full rounded-full ${kindColors[entry.kind] ?? "bg-sky"}`}
                        style={{ width: `${(entry.count / maxLabel) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollList>
          )}
        </div>

        <div className="mt-8 rounded-3xl bg-paper px-4 py-5 shadow-[0_0_0_1px_rgba(240,224,196,0.95)] sm:px-6">
          <p className="text-sm text-ink-soft">Từng lượt · giờ Việt Nam</p>
          {loading ? (
            <p className="mt-4 text-ink-soft">Đang tải…</p>
          ) : rows.length === 0 ? (
            <p className="mt-4 text-ink-soft">Chưa có dòng nào.</p>
          ) : (
            <ScrollList tall>
              <ul className="divide-y divide-[#f0e0c4]">
                {rows.map((row) => (
                  <li key={row.id} className="flex items-start justify-between gap-4 py-3">
                    <span className="min-w-0">
                      <span className="block text-ink">{clickLabel(row, items)}</span>
                      {row.location || row.ip ? (
                        <span className="mt-0.5 block text-sm text-ink-soft">
                          {[row.location, row.ip].filter(Boolean).join(" · ")}
                        </span>
                      ) : null}
                    </span>
                    <time className="shrink-0 text-sm text-ink-soft" dateTime={row.created_at}>
                      {formatTime(row.created_at)}
                    </time>
                  </li>
                ))}
              </ul>
            </ScrollList>
          )}
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-paper px-3 py-4 text-center shadow-[0_0_0_1px_rgba(240,224,196,0.95)]">
      <p className="font-display text-2xl text-ink sm:text-3xl">{value}</p>
      <p className="mt-1 text-[12px] text-ink-soft">{label}</p>
    </div>
  );
}

function ScrollList({ children, tall = false }: { children: ReactNode; tall?: boolean }) {
  return (
    <div
      className={`mt-4 overflow-y-auto overscroll-contain pr-1 ${
        tall ? "max-h-[min(22rem,50vh)]" : "max-h-52"
      }`}
    >
      {children}
    </div>
  );
}
