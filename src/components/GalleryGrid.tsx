import type { GalleryItem } from "../data/gallery";
import { useColumnCount } from "../hooks/useColumnCount";
import { countFor, type CountsMap } from "../hooks/usePhotoStats";
import { HeartMark } from "./HeartMark";

type GalleryGridProps = {
  items: GalleryItem[];
  counts?: CountsMap;
  onSelect: (item: GalleryItem) => void;
  onHeart?: (id: string) => void;
  heading?: string;
  loading?: boolean;
  error?: string | null;
};

export function GalleryGrid({
  items,
  counts = {},
  onSelect,
  onHeart,
  heading,
  loading = false,
  error = null,
}: GalleryGridProps) {
  const columnCount = useColumnCount();
  const columns = splitIntoColumns(items, columnCount);

  return (
    <section id="gallery" className="bg-cream">
      <div className="mx-auto max-w-[1240px] px-4 pb-28 pt-4 sm:px-5 sm:pb-16 sm:pt-8 lg:px-8">
        {heading ? (
          <div className="mb-6 sm:mb-8">
            <p className="text-[12px] tracking-[0.22em] text-ink-soft">PHÒNG TRANH</p>
            <h2 className="font-display mt-2 text-3xl text-ink sm:text-4xl">{heading}</h2>
          </div>
        ) : null}

        {error ? (
          <p className="py-16 text-center font-serif text-xl italic text-ink-soft">
            {error}
          </p>
        ) : loading ? (
          <div className="flex gap-3 sm:gap-4">
            {Array.from({ length: columnCount }, (_, columnIndex) => (
              <div key={columnIndex} className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-4">
                <div className="aspect-[3/4] rounded-[18px] bg-sand" />
                <div className="aspect-square rounded-[18px] bg-sand-deep/80" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="py-16 text-center font-serif text-xl italic text-ink-soft">
            Chưa có ảnh trong phòng tranh.
          </p>
        ) : (
          <div className="flex gap-3 sm:gap-4">
            {columns.map((column, columnIndex) => (
              <div key={columnIndex} className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-4">
                {column.map((item) => {
                  const hearts = countFor(counts, item.id).hearts;
                  return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect(item)}
                    className="group overflow-hidden rounded-[18px] bg-paper text-left shadow-[0_8px_24px_rgba(58,42,34,0.08)] ring-1 ring-[#f0e0c4]"
                  >
                    <span className="relative block aspect-[3/4] overflow-hidden bg-sand">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="absolute inset-0 h-full w-full object-contain transition duration-500 group-hover:scale-[1.03]"
                      />
                      {onHeart ? (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(event) => {
                            event.stopPropagation();
                            onHeart(item.id);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              event.stopPropagation();
                              onHeart(item.id);
                            }
                          }}
                          className="absolute bottom-2 left-2 z-10 flex min-h-9 items-center gap-1 rounded-full bg-[#fff8ef]/95 px-2.5 text-sm text-ink shadow-sm ring-1 ring-[#f0e0c4]"
                          aria-label="Thả tim"
                        >
                          <HeartMark className="h-4 w-4" filled={hearts > 0} />
                          <span className="min-w-[0.75rem] tabular-nums text-ink-soft">
                            {hearts || ""}
                          </span>
                        </span>
                      ) : null}
                    </span>
                  </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function splitIntoColumns(items: GalleryItem[], count: number) {
  const columns: GalleryItem[][] = Array.from({ length: count }, () => []);
  items.forEach((item, index) => {
    columns[index % count].push(item);
  });
  return columns;
}
