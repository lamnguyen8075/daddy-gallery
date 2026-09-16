import { LeafMark } from "./LeafMark";

type AboutPageProps = {
  onExplore: () => void;
};

export function AboutPage({ onExplore }: AboutPageProps) {
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-5 sm:py-16 lg:px-8 lg:py-24">
        <p className="text-[12px] tracking-[0.22em] text-ink-soft">PHÒNG TRANH CỦA BA</p>
        <h1 className="font-display mt-4 text-3xl text-ink sm:text-5xl">
          Chỗ để tranh Ba làm
        </h1>
        <p className="mt-5 font-serif text-lg leading-8 italic text-ink-soft sm:mt-6 sm:text-xl">
          Cây dây đồng, thú kẽm nhung, chai tái chế, tranh treo kẹp.
        </p>
        <div className="mt-8 space-y-5 text-[16px] leading-8 text-ink-soft sm:mt-10">
          <p>
            Đây không phải cửa hàng. Chỉ là phòng tranh giữ những món thủ công Ba
            làm ở nhà — rừng dây vàng, khay Giáng sinh, hoa vải, đồ làm từ lọ
            và sợi còn lại.
          </p>
          <p>
            Để ở đây cho dễ xem lại, khỏi lẫn trong cuộn ảnh điện thoại.
          </p>
        </div>
        <div className="mt-10 flex items-center gap-4 sm:mt-12">
          <LeafMark className="h-12 w-12 shrink-0" />
          <p className="font-hand text-xl text-script sm:text-2xl">Làm bằng tay, để ở đây.</p>
        </div>
        <button
          type="button"
          onClick={onExplore}
          className="mt-8 min-h-12 w-full rounded-full bg-leaf px-6 py-3 text-white sm:mt-10 sm:w-auto"
        >
          Xem tranh
        </button>
      </div>
    </section>
  );
}
