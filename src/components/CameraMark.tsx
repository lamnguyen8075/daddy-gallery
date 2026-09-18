type CameraMarkProps = {
  className?: string;
};

export function CameraMark({ className = "h-7 w-7" }: CameraMarkProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path
        d="M8.5 11.5h2.2l1.1-2.1c.2-.4.6-.6 1-.6h6.4c.4 0 .8.2 1 .6l1.1 2.1h2.2c1.4 0 2.5 1.1 2.5 2.5v8c0 1.4-1.1 2.5-2.5 2.5h-15c-1.4 0-2.5-1.1-2.5-2.5v-8c0-1.4 1.1-2.5 2.5-2.5Z"
        stroke="#2f9e5a"
        strokeWidth="2.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx="16" cy="18" r="3.6" stroke="#2f9e5a" strokeWidth="2.4" />
      <circle cx="16" cy="18" r="1.55" fill="#f0b429" />
      <path
        d="M23.2 7.2v4.4M21 9.4h4.4"
        stroke="#e85d4c"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
