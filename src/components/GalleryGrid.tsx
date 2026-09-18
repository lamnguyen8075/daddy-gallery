import type { GalleryItem } from "../data/gallery";
import { useColumnCount } from "../hooks/useColumnCount";

type GalleryGridProps = {
  items: GalleryItem[];
  onSelect: (item: GalleryItem) => void;
  heading?: string;
  loading?: boolean;
  error?: string | null;
};

export function GalleryGrid({
  items,
  onSelect,
  heading,
  loading = false,
  error = null,
}: GalleryGridProps) {
  const columnCount = useColumnCount();
  const columns = splitIntoColumns(items, columnCount);

  return (
    <section id="gallery" className="bg-cream">
      <div className="mx-auto max-w-[1240px] px-4 pb-28 pt-6 sm:px-5 sm:pb-16 sm:pt-8 lg:px-8">
        {heading ? (
          <div className="mb-6 sm:mb-8">
            <p className="text-[12px] tracking-[0.22em] text-ink-soft">PHÒNG TRANH</p>
            <h2 className="font-display mt-2 text-3xl text-ink sm:text-4xl">{heading}</h2>
          </div>
        ) : (
          <p className="mb-5 font-serif text-base italic text-ink-soft sm:mb-7 sm:text-lg">
            Những món gần nhà
          </p>
        )}

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
                {column.map((item) => (
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
                    </span>
                  </button>
                ))}
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
