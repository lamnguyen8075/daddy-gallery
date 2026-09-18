type PersonMarkProps = {
  className?: string;
};

export function PersonMark({ className = "h-6 w-6" }: PersonMarkProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5.5 19.2c.8-3.4 3.1-5.2 6.5-5.2s5.7 1.8 6.5 5.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
