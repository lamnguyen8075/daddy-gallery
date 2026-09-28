export function HeartMark({ className, filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        fill={filled ? "#e85d4c" : "none"}
        stroke="#e85d4c"
        strokeWidth="1.7"
        strokeLinejoin="round"
        transform="translate(0 -0.35)"
      />
    </svg>
  );
}
