import { useEffect, useRef, useState } from "react";
import { checkAdminPassword } from "../lib/admin";

type AdminGateProps = {
  onClose: () => void;
  onUnlock: () => void;
};

export function AdminGate({ onClose, onUnlock }: AdminGateProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function submit() {
    if (!checkAdminPassword(password)) {
      setError(true);
      return;
    }
    onUnlock();
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-[#3a2a22]/45 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-[3px] sm:items-center"
      onClick={onClose}
    >
      <form
        className="w-full max-w-sm rounded-[28px] bg-paper px-5 py-6 shadow-[0_20px_50px_rgba(58,42,34,0.22)] ring-1 ring-[#f0e0c4]"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <p className="text-[12px] tracking-[0.22em] text-ink-soft">ADMIN</p>
        <h2 className="font-display mt-2 text-2xl text-ink">Nhập mật khẩu</h2>
        <input
          ref={inputRef}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setError(false);
          }}
          className="mt-5 min-h-12 w-full rounded-full border border-[#f0e0c4] bg-cream px-5 text-[16px] text-ink outline-none focus:ring-2 focus:ring-leaf/40"
        />
        {error ? <p className="mt-3 text-sm text-script">Sai mật khẩu.</p> : null}
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 flex-1 rounded-full border border-[#f0e0c4] bg-paper text-ink-soft"
          >
            Đóng
          </button>
          <button type="submit" className="min-h-12 flex-1 rounded-full bg-leaf text-white">
            Vào
          </button>
        </div>
      </form>
    </div>
  );
}
