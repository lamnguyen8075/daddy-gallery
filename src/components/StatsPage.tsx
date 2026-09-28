import type { GalleryItem } from "../data/gallery";
import { getCachedCaption } from "../lib/captionStore";
import { countFor, type CountsMap } from "../hooks/usePhotoStats";
import { HeartMark } from "./HeartMark";

type StatsPageProps = {
  items: GalleryItem[];
  counts: CountsMap;
  onSelect: (item: GalleryItem) => void;
};

export function StatsPage({ items, counts, onSelect }: StatsPageProps) {
  const ranked = items.map((item) => ({
    item,
    hearts: countFor(counts, item.id).hearts,
    views: countFor(counts, item.id).views,
  }));

  const topHearts = [...ranked]
    .filter((row) => row.hearts > 0)
    .sort((a, b) => b.hearts - a.hearts || b.views - a.views)
    .slice(0, 10);
  const topViews = [...ranked]
    .filter((row) => row.views > 0)
    .sort((a, b) => b.views - a.views || b.hearts - a.hearts)
    .slice(0, 10);

  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-5 sm:py-16 lg:px-8">
        <p className="text-[12px] tracking-[0.22em] text-ink-soft">THỐNG KÊ</p>
        <h1 className="font-display mt-3 text-3xl text-ink sm:text-5xl">Ảnh được thương nhiều</h1>
        <p className="mt-3 font-serif text-lg leading-7 text-ink-soft">
          Mười món được thả tim nhiều nhất, và mười món được xem nhiều nhất.
        </p>

        <RankList
          heading="Nhiều tim nhất"
          rows={topHearts}
          valueKey="hearts"
          onSelect={onSelect}
        />
        <RankList
          heading="Nhiều lượt xem nhất"
          rows={topViews}
          valueKey="views"
          onSelect={onSelect}
        />
      </div>
    </section>
  );
}

function RankList({
  heading,
  rows,
  valueKey,
  onSelect,
}: {
  heading: string;
  rows: { item: GalleryItem; hearts: number; views: number }[];
  valueKey: "hearts" | "views";
  onSelect: (item: GalleryItem) => void;
}) {
  return (
    <div className="mt-8 rounded-[28px] bg-paper px-4 py-5 shadow-[0_0_0_1px_rgba(240,224,196,0.95)] sm:px-6">
      <p className="text-sm text-ink-soft">{heading}</p>
      {rows.length === 0 ? (
        <p className="mt-4 text-ink-soft">
          {valueKey === "hearts" ? "Chưa có tim nào. Bấm trái tim trên ảnh nhé." : "Chưa có lượt xem nào."}
        </p>
      ) : (
        <ol className="mt-4 divide-y divide-[#f0e0c4]">
          {rows.map((row, index) => {
            const title = getCachedCaption(row.item.id)?.title ?? row.item.title;
            const value = row[valueKey];
            return (
              <li key={row.item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(row.item)}
                  className="flex w-full items-center gap-3 py-3 text-left"
                >
                  <span className="w-6 shrink-0 text-sm text-ink-soft">{index + 1}</span>
                  <img
                    src={row.item.image}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-xl bg-sand object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-ink">{title}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-sm text-ink-soft">
                    {valueKey === "hearts" ? <HeartMark className="h-4 w-4" filled /> : null}
                    {value}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
