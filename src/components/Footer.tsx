type FooterProps = {
  message?: string;
};

export function Footer({ message = "Phòng tranh của Ba" }: FooterProps) {
  return (
    <footer className="relative overflow-hidden bg-cream">
      <svg
        className="block w-full text-[#ffe6a8]"
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M0,64 C240,20 480,10 720,38 C960,66 1200,78 1440,36 L1440,90 L0,90 Z"
        />
      </svg>
      <div className="bg-[#ffe6a8] pb-[env(safe-area-inset-bottom)]">
        <p className="font-script px-5 py-8 text-center text-4xl text-ink sm:py-10 sm:text-5xl">
          {message} <span className="text-script">♡</span>
        </p>
      </div>
    </footer>
  );
}
