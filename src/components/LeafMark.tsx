type LeafMarkProps = {
  className?: string;
};

export function LeafMark({ className = "h-10 w-10" }: LeafMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 50c2-16 12-32 40-40-4 20-18 36-40 40Z"
        stroke="#1f7a4d"
        strokeWidth="1.6"
        fill="none"
      />
      <path
        d="M12 50c12-6 22-18 28-34"
        stroke="#1f7a4d"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M22 42c6-2 10-8 12-14"
        stroke="#c9a227"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
}
