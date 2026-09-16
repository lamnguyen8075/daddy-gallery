type HeroProps = {
  onExplore: () => void;
  photos: string[];
};

export function Hero({ onExplore, photos }: HeroProps) {
  const [one, two, three] = photos;

  return (
    <section className="hero-light relative overflow-hidden">
      <div className="mx-auto grid max-w-[1240px] items-center gap-6 px-4 py-8 sm:gap-8 sm:px-5 sm:py-10 lg:grid-cols-[minmax(280px,0.95fr)_minmax(0,1.05fr)] lg:px-8 lg:py-16">
        <div className="fade-up min-w-0 max-w-xl">
          <p className="mb-4 text-[12px] tracking-[0.22em] text-ink-soft">
            PHÒNG TRANH CỦA BA
          </p>
          <h1 className="font-display text-[30px] leading-[1.15] text-ink sm:text-5xl lg:text-[56px]">
            Tranh Ba làm
            <br />
            ở nhà
          </h1>
          <p className="mt-5 max-w-md font-serif text-[17px] leading-7 text-ink-soft sm:mt-6 sm:text-[18px]">
            Cây dây đồng, thú kẽm nhung, chai tái chế — để đây cho dễ xem lại.
          </p>
          <button
            type="button"
            onClick={onExplore}
            className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-leaf px-6 py-3 text-[15px] text-white shadow-[0_8px_20px_rgba(47,158,90,0.28)] sm:mt-8 sm:w-auto"
          >
            Xem tranh
            <span aria-hidden="true">→</span>
          </button>
        </div>

        <div className="relative mx-auto h-[260px] w-full max-w-[520px] sm:h-[420px]">
          {two ? (
            <img
              src={two}
              alt=""
              className="absolute left-[4%] top-[18%] h-[70%] w-[46%] rotate-[-6deg] rounded-[22px] bg-paper object-cover shadow-[0_16px_36px_rgba(58,42,34,0.14)] ring-4 ring-white"
            />
          ) : null}
          {three ? (
            <img
              src={three}
              alt=""
              className="absolute right-[2%] top-[8%] h-[62%] w-[44%] rotate-[7deg] rounded-[22px] bg-paper object-cover shadow-[0_16px_36px_rgba(58,42,34,0.12)] ring-4 ring-white"
            />
          ) : null}
          {one ? (
            <img
              src={one}
              alt=""
              className="absolute bottom-[6%] left-[22%] h-[72%] w-[56%] rounded-[24px] bg-paper object-cover shadow-[0_20px_44px_rgba(58,42,34,0.18)] ring-4 ring-white"
            />
          ) : (
            <div className="absolute inset-10 rounded-[24px] bg-sand" />
          )}
        </div>
      </div>
    </section>
  );
}
