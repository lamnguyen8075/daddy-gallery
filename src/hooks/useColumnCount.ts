import { useEffect, useState } from "react";

function columnCountForWidth(width: number) {
  if (width < 720) return 2;
  if (width < 1024) return 3;
  if (width < 1280) return 4;
  return 5;
}

export function useColumnCount() {
  const [count, setCount] = useState(() =>
    typeof window === "undefined" ? 2 : columnCountForWidth(window.innerWidth),
  );

  useEffect(() => {
    const update = () => setCount(columnCountForWidth(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return count;
}
