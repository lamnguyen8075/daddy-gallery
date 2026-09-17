import { useEffect, useState } from "react";
import type { GalleryItem } from "./data/gallery";
import { AboutPage } from "./components/AboutPage";
import { AnalyticsPage } from "./components/AnalyticsPage";
import { Footer } from "./components/Footer";
import { GalleryGrid } from "./components/GalleryGrid";
import { Header, type AppPage, type PageId } from "./components/Header";
import { Hero } from "./components/Hero";
import { PhotoDetail } from "./components/PhotoDetail";
import { useGalleryItems } from "./hooks/useGalleryItems";
import { logClick } from "./lib/clicks";

export default function App() {
  const { items, loading, error } = useGalleryItems();
  const [page, setPage] = useState<AppPage>("home");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedIndex = items.findIndex((item) => item.id === selectedId);
  const selectedItem = selectedIndex >= 0 ? items[selectedIndex] : null;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view");
    if (view === "clicks") setPage("analytics");
    else if (view === "gallery" || view === "about" || view === "home") {
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
    else if (next === "analytics") url.searchParams.set("view", "clicks");
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

  return (
    <div className="min-h-screen overflow-x-hidden bg-cream pb-[env(safe-area-inset-bottom)]">
      <Header page={page} onNavigate={navigate} />

      {page === "analytics" ? (
        <AnalyticsPage items={items} />
      ) : page === "about" ? (
        <AboutPage onExplore={() => navigate("gallery")} />
      ) : (
        <>
          {page === "home" ? <Hero onExplore={openGallery} /> : null}
          <GalleryGrid
            items={items}
            onSelect={selectItem}
            heading={page === "gallery" ? "Tất cả tác phẩm" : undefined}
            loading={loading}
            error={error}
          />
        </>
      )}

      <Footer onSecret={openAnalytics} />

      {selectedItem ? (
        <PhotoDetail
          item={selectedItem}
          onClose={closeItem}
          onPrev={showPrev}
          onNext={showNext}
        />
      ) : null}
    </div>
  );
}
