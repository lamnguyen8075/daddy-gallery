type HeroProps = {
  onExplore: () => void;
};

const workshopSketch = `${import.meta.env.BASE_URL}header-workshop-sketch.png`;

export function Hero({ onExplore }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-cream">
      <div className="relative min-h-[420px] sm:min-h-[520px] lg:min-h-[620px]">
        <img
          src={workshopSketch}
          alt="Xưởng thủ công ở nhà"
          className="absolute inset-0 h-full w-full object-cover object-[center_46%] brightness-[1.04] contrast-[1.06] saturate-[1.12]"
        />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-cream/90 to-transparent" />

        <div className="relative mx-auto flex min-h-[420px] max-w-[1240px] items-end px-4 py-8 sm:min-h-[520px] sm:px-5 sm:py-10 lg:min-h-[620px] lg:px-8 lg:py-12">
          <div className="fade-up max-w-md rounded-[24px] bg-[#fff8ef]/95 p-5 shadow-[0_16px_40px_rgba(58,42,34,0.12)] ring-1 ring-[#f0e0c4] sm:p-7">
            <p className="mb-3 text-[12px] tracking-[0.22em] text-ink-soft">THỦ CÔNG QUÊ NHÀ</p>
            <h1 className="font-display text-[30px] leading-[1.15] text-ink sm:text-5xl">
              Phòng trưng bày
              <br />
              của anh Ngọ!
            </h1>
            <p className="mt-4 font-serif text-[17px] leading-7 text-ink-soft sm:text-[18px]">
              Cây dây đồng, thú kẽm nhung, chai tái chế — để đây cho dễ xem lại.
            </p>
            <button
              type="button"
              onClick={onExplore}
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-leaf px-6 py-3 text-[15px] text-white shadow-[0_8px_20px_rgba(47,158,90,0.28)] sm:w-auto"
            >
              Xem tác phẩm
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
