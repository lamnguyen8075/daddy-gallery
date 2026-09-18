import { useEffect, useState } from "react";
import type { GalleryItem } from "./data/gallery";
import { AboutPage } from "./components/AboutPage";
import { AdminGate } from "./components/AdminGate";
import { AnalyticsPage } from "./components/AnalyticsPage";
import { CameraMark } from "./components/CameraMark";
import { Footer } from "./components/Footer";
import { GalleryGrid } from "./components/GalleryGrid";
import { Header, type AppPage, type PageId } from "./components/Header";
import { Hero } from "./components/Hero";
import { PhotoDetail } from "./components/PhotoDetail";
import { UploadPage } from "./components/UploadPage";
import { useGalleryItems } from "./hooks/useGalleryItems";
import { isAdminSession, setAdminSession } from "./lib/admin";
import { logClick } from "./lib/clicks";
import { clearCachedCaption } from "./lib/captionStore";
import { deleteGalleryImage } from "./lib/upload";

export default function App() {
  const { items, loading, error, addItem, removeItem, reload } = useGalleryItems();
  const [page, setPage] = useState<AppPage>("home");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [admin, setAdmin] = useState(isAdminSession);
  const [adminGate, setAdminGate] = useState(false);

  const selectedIndex = items.findIndex((item) => item.id === selectedId);
  const selectedItem = selectedIndex >= 0 ? items[selectedIndex] : null;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view");
    if (view === "nhatky" || view === "clicks") setPage("analytics");
    else if (view === "gallery" || view === "about" || view === "home" || view === "upload") {
      setPage(view);
    }
  }, []);

  useEffect(() => {
    const photo = new URLSearchParams(window.location.search).get("photo");
    if (photo && items.some((item) => item.id === photo)) {
      setSelectedId(photo);
    }
  }, [items]);

  useEffect(() => {
    if (selectedId) logClick("photo", selectedId);
  }, [selectedId]);

  function setPhotoInUrl(id: string | null) {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("photo", id);
    else url.searchParams.delete("photo");
    window.history.replaceState({}, "", url);
  }

  function setViewInUrl(next: AppPage) {
    const url = new URL(window.location.href);
    if (next === "home") url.searchParams.delete("view");
    else if (next === "analytics") url.searchParams.set("view", "nhatky");
    else url.searchParams.set("view", next);
    window.history.replaceState({}, "", url);
  }

  function openAnalytics() {
    setSelectedId(null);
    setPhotoInUrl(null);
    setPage("analytics");
    setViewInUrl("analytics");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openUpload() {
    setSelectedId(null);
    setPhotoInUrl(null);
    setPage("upload");
    setViewInUrl("upload");
  }

  function closeUpload() {
    setPage("home");
    setViewInUrl("home");
  }

  function seeUploaded(item: GalleryItem) {
    addItem(item);
    setSelectedId(item.id);
    setPhotoInUrl(item.id);
    setPage("gallery");
    setViewInUrl("gallery");
  }

  function openGallery() {
    logClick("cta", "xem-tac-pham");
    setPage("home");
    window.setTimeout(() => {
      document.getElementById("gallery")?.scrollIntoView({ behavior: "smooth" });
    }, 40);
  }

  function navigate(next: PageId) {
    logClick("nav", next);
    setPage(next);
    setViewInUrl(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleAdmin() {
    if (admin) {
      setAdminSession(false);
      setAdmin(false);
      return;
    }
    setAdminGate(true);
  }

  async function deleteItem(item: GalleryItem) {
    await deleteGalleryImage(item);
    clearCachedCaption(item.id);
    removeItem(item.id);
    setSelectedId(null);
    setPhotoInUrl(null);
    reload();
  }

  function selectItem(item: GalleryItem) {
    setSelectedId(item.id);
    setPhotoInUrl(item.id);
  }

  function closeItem() {
    setSelectedId(null);
    setPhotoInUrl(null);
  }

  function showPrev() {
    if (items.length === 0 || selectedIndex < 0) return;
    const next = (selectedIndex - 1 + items.length) % items.length;
    setSelectedId(items[next].id);
    setPhotoInUrl(items[next].id);
  }

  function showNext() {
    if (items.length === 0 || selectedIndex < 0) return;
    const next = (selectedIndex + 1) % items.length;
    setSelectedId(items[next].id);
    setPhotoInUrl(items[next].id);
  }

  const showFab = page !== "upload" && page !== "analytics" && !selectedItem;

  return (
    <div className="min-h-screen overflow-x-hidden bg-cream pb-[env(safe-area-inset-bottom)]">
      <Header page={page} admin={admin} onNavigate={navigate} onAdmin={toggleAdmin} />

      {page === "analytics" ? (
        <AnalyticsPage items={items} />
      ) : page === "about" ? (
        <AboutPage onExplore={() => navigate("gallery")} />
      ) : (
        <>
          {page === "home" ? <Hero onExplore={openGallery} /> : null}
          {page === "upload" ? null : (
            <GalleryGrid
              items={items}
              onSelect={selectItem}
              heading={page === "gallery" ? "Tất cả tác phẩm" : undefined}
              loading={loading}
              error={error}
            />
          )}
        </>
      )}

      <Footer onSecret={openAnalytics} />

      {showFab ? (
        <button
          type="button"
          onClick={openUpload}
          aria-label="Gửi ảnh"
          className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-40 grid h-12 w-12 place-items-center rounded-full bg-[#fff8ef] shadow-[0_10px_28px_rgba(58,42,34,0.18)] ring-2 ring-[#f0b429]/80 sm:bottom-6 sm:right-6"
        >
          <CameraMark className="h-6 w-6" />
        </button>
      ) : null}

      {page === "upload" ? (
        <UploadPage onClose={closeUpload} onSeePhoto={seeUploaded} />
      ) : null}

      {adminGate ? (
        <AdminGate
          onClose={() => setAdminGate(false)}
          onUnlock={() => {
            setAdminSession(true);
            setAdmin(true);
            setAdminGate(false);
          }}
        />
      ) : null}

      {selectedItem ? (
        <PhotoDetail
          item={selectedItem}
          admin={admin}
          onClose={closeItem}
          onPrev={showPrev}
          onNext={showNext}
          onDelete={admin ? deleteItem : undefined}
        />
      ) : null}
    </div>
  );
}
