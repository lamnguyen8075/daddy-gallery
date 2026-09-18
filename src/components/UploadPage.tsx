import { useEffect, useRef, useState, type DragEvent } from "react";
import { CameraMark } from "./CameraMark";
import type { GalleryItem } from "../data/gallery";
import { setCachedCaption, type PhotoCaption } from "../lib/captionStore";
import { generateCaption, maxUploadBytes, prepareUploadFile, uploadGalleryImage, validateUploadFile } from "../lib/upload";

type UploadPageProps = {
  onClose: () => void;
  onSeePhoto: (item: GalleryItem) => void;
};

type Stage = "pick" | "compressing" | "uploading" | "describing" | "done" | "error";

export function UploadPage({ onClose, onSeePhoto }: UploadPageProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("pick");
  const [error, setError] = useState<string | null>(null);
  const [item, setItem] = useState<GalleryItem | null>(null);
  const [caption, setCaption] = useState<PhotoCaption | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    };
  }, []);

  async function chooseFile(next: File | undefined) {
    if (!next) return;
    try {
      validateUploadFile(next);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không dùng được ảnh này.");
      setStage("error");
      return;
    }

    let ready = next;
    if (next.size > maxUploadBytes) {
      setStage("compressing");
      setError(null);
      try {
        ready = await prepareUploadFile(next);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Không thu nhỏ được ảnh.");
        setStage("error");
        return;
      }
    }

    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    const url = URL.createObjectURL(ready);
    previewUrl.current = url;
    setFile(ready);
    setPreview(url);
    setError(null);
    setStage("pick");
    setItem(null);
    setCaption(null);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files[0]);
  }

  async function submit() {
    if (!file) return;
    setError(null);
    setStage("uploading");
    try {
      const nextItem = await uploadGalleryImage(file);
      setItem(nextItem);
      setStage("describing");
      const nextCaption = await generateCaption(nextItem.id, nextItem.image);
      if (nextCaption) {
        setCachedCaption(nextItem.id, nextCaption);
        setCaption(nextCaption);
      }
      setStage("done");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không gửi được ảnh.");
      setStage("error");
    }
  }

  const busy = stage === "compressing" || stage === "uploading" || stage === "describing";

  return (
    <section className="fixed inset-0 z-[60] overflow-y-auto bg-cream pt-[env(safe-area-inset-top)]">
      <div className="mx-auto max-w-3xl px-4 py-6 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-5 sm:py-10 lg:px-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[12px] tracking-[0.22em] text-ink-soft">THÊM ẢNH</p>
            <h1 className="font-display mt-2 text-3xl text-ink sm:text-4xl">Gửi một món</h1>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-paper ring-1 ring-[#f0e0c4]"
            aria-label="Đóng"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                fill="none"
                stroke="#e85d4c"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <p className="mt-3 font-serif text-lg leading-7 text-ink-soft">
          Bấm ô lớn để chụp hoặc chọn ảnh trong máy.
        </p>

        <label
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`mt-6 block min-h-44 cursor-pointer rounded-[28px] border border-dashed bg-paper p-5 text-center shadow-[0_0_0_1px_rgba(240,224,196,0.95)] sm:p-8 ${
            dragging ? "border-leaf bg-sand" : "border-[#f0e0c4]"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => chooseFile(event.target.files?.[0])}
          />
          {preview ? (
            <img src={preview} alt="" className="mx-auto max-h-[50dvh] rounded-[22px] object-contain" />
          ) : (
            <span className="flex min-h-40 flex-col items-center justify-center gap-2 py-6">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-[#fff8ef] ring-2 ring-[#f0b429]/80">
                <CameraMark className="h-6 w-6" />
              </span>
              <span className="font-display mt-2 text-2xl text-ink">Chụp hoặc chọn ảnh</span>
              <span className="text-ink-soft">JPG, PNG, ảnh điện thoại</span>
            </span>
          )}
        </label>

        {file ? (
          <p className="mt-3 text-sm text-ink-soft">
            {file.name} · {Math.max(1, Math.round(file.size / 1024))} KB
          </p>
        ) : null}

        {stage === "compressing" ? (
          <p className="mt-6 text-ink-soft">Ảnh lớn quá, đang thu nhỏ cho vừa gửi...</p>
        ) : null}
        {stage === "uploading" ? (
          <p className="mt-6 text-ink-soft">Đang đưa ảnh lên phòng tranh...</p>
        ) : null}
        {stage === "describing" ? (
          <p className="mt-6 text-ink-soft">Đang xem ảnh và viết tên món...</p>
        ) : null}

        {error ? <p className="mt-6 rounded-2xl bg-sand px-4 py-4 text-ink-soft">{error}</p> : null}

        {stage === "done" && item ? (
          <div className="mt-8 rounded-[28px] bg-paper px-5 py-6 shadow-[0_0_0_1px_rgba(240,224,196,0.95)] sm:px-6">
            <p className="text-[12px] tracking-[0.22em] text-ink-soft">ĐÃ LÊN PHÒNG TRANH</p>
            <h2 className="font-display mt-3 text-2xl text-ink sm:text-3xl">
              {caption?.title ?? "Ảnh mới gửi"}
            </h2>
            <p className="mt-3 leading-7 text-ink-soft">
              {caption?.description ?? "Ảnh đã lên phòng tranh. Tên món sẽ hiện khi máy viết xong."}
            </p>
            <button
              type="button"
              onClick={() => onSeePhoto(item)}
              className="mt-6 min-h-14 w-full rounded-full bg-leaf px-6 py-3 text-white"
            >
              Xem ảnh
            </button>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              disabled={!file || busy}
              onClick={() => void submit()}
              className="min-h-14 rounded-full bg-leaf px-6 py-3 text-lg text-white disabled:opacity-40"
            >
              {busy ? "Đang gửi..." : "Gửi ảnh"}
            </button>
            {file ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
                className="min-h-12 rounded-full border border-[#f0e0c4] bg-paper px-6 py-3 text-ink-soft"
              >
                Chọn ảnh khác
              </button>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
