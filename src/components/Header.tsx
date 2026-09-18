import { PersonMark } from "./PersonMark";

export type PageId = "home" | "gallery" | "about";
export type AppPage = PageId | "analytics" | "upload";

type HeaderProps = {
  page: AppPage;
  admin?: boolean;
  onNavigate: (page: PageId) => void;
  onAdmin: () => void;
};

const navItems: { id: PageId; label: string }[] = [
  { id: "home", label: "Trang chủ" },
  { id: "gallery", label: "Tác phẩm" },
  { id: "about", label: "Giới thiệu" },
];

export function Header({ page, admin = false, onNavigate, onAdmin }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#f0e0c4]/90 bg-[#fff8ef]/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto max-w-[1240px] px-4 py-3 sm:px-5 sm:py-4 lg:px-8">
        <div className="flex items-center justify-between gap-3">
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

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <nav className="hidden items-center sm:flex">
              {navItems.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  active={page === item.id}
                  onNavigate={onNavigate}
                />
              ))}
            </nav>
            <button
              type="button"
              onClick={onAdmin}
              aria-label={admin ? "Thoát admin" : "Admin"}
              className={`grid h-11 w-11 place-items-center rounded-full ${
                admin ? "bg-leaf text-white" : "text-ink-soft"
              }`}
            >
              <PersonMark className="h-6 w-6" />
            </button>
          </div>
        </div>

        <nav className="mt-3 flex items-center sm:hidden">
          {navItems.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={page === item.id}
              onNavigate={onNavigate}
            />
          ))}
        </nav>
      </div>
    </header>
  );
}

function NavButton({
  item,
  active,
  onNavigate,
}: {
  item: { id: PageId; label: string };
  active: boolean;
  onNavigate: (page: PageId) => void;
}) {
  return (
    <button
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
}
