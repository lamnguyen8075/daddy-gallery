export type PageId = "home" | "gallery" | "about";
export type AppPage = PageId | "analytics";

type HeaderProps = {
  page: AppPage;
  onNavigate: (page: PageId) => void;
};

const navItems: { id: PageId; label: string }[] = [
  { id: "home", label: "Trang chủ" },
  { id: "gallery", label: "Tác phẩm" },
  { id: "about", label: "Giới thiệu" },
];

export function Header({ page, onNavigate }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#f0e0c4]/90 bg-[#fff8ef]/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-4 lg:px-8">
        <button
          type="button"
          onClick={() => onNavigate("home")}
          className="flex min-w-0 items-center gap-2 text-left"
        >
          <img
            src={`${import.meta.env.BASE_URL}craven-pack-sketch.png`}
            alt=""
            className="h-11 w-auto shrink-0 sm:h-[3.25rem]"
          />
          <span className="min-w-0 leading-none">
            <span className="font-script block text-[22px] leading-tight text-ink sm:text-[30px] lg:text-[34px]">
              Phòng tranh của Ba
            </span>
            <span className="mt-1 block font-serif text-[12px] tracking-[0.04em] text-ink-soft sm:text-[13px] sm:tracking-[0.12em]">
              Thủ công quê nhà
            </span>
          </span>
        </button>

        <nav className="flex w-full items-center sm:w-auto">
          {navItems.map((item) => {
            const active = page === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`relative min-h-11 flex-1 px-2 text-[14px] tracking-wide sm:flex-none sm:px-4 sm:text-[15px] ${
                  active ? "font-medium text-ink" : "text-ink-soft"
                }`}
              >
                {item.label}
                {active ? (
                  <span className="absolute inset-x-3 -bottom-0.5 mx-auto h-px w-8 bg-leaf sm:inset-x-0" />
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
