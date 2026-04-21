import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/ThemeContext";
import FilterBar from "../components/FilterBar";
import MediaGrid from "../components/MediaGrid";
import MediaPreview from "../components/MediaPreview";
import { useGridNav } from "../hooks/useGridNav";
import type { MediaItem } from "../types";

export default function BrowsePage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<{ type?: string; group_id?: number; author_id?: string }>({});
  const { theme } = useTheme();
  const isBold = theme === "bold";
  const [preview, setPreview] = useState<MediaItem | null>(null);
  const [numCols, setNumCols] = useState(3);
  const [itemCount, setItemCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<MediaItem[]>([]);

  const openPreview = useCallback((index: number) => {
    const item = itemsRef.current[index];
    if (item) setPreview(item);
  }, []);

  const { focusedIndex, setFocus, resetFocus } = useGridNav({
    itemCount,
    numCols,
    enabled: !preview,
    containerRef,
    onEnter: openPreview,
  });

  const handleMediaClick = useCallback((media: MediaItem, index: number) => {
    setFocus(index);
    setPreview(media);
  }, [setFocus]);

  const handlePreviewNavigate = useCallback((media: MediaItem) => {
    const index = itemsRef.current.findIndex((m) => m.id === media.id);
    if (index >= 0) setFocus(index);
    setPreview(media);
  }, [setFocus]);

  return (
    <div className={isBold ? "-m-6" : ""} ref={containerRef}>
      {!isBold && (
        <>
          <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>{t("pages.browse.title")}</h1>
          <FilterBar filters={filters} onChange={(f) => { setFilters(f); resetFocus(); }} />
        </>
      )}
      {isBold && (
        <div className="px-4 py-3 flex items-center gap-3">
          <FilterBar filters={filters} onChange={(f) => { setFilters(f); resetFocus(); }} />
        </div>
      )}
      <div className={isBold ? "px-2 pb-2" : ""}>
        <MediaGrid
          type={filters.type}
          authorId={filters.author_id}
          groupId={filters.group_id}
          focusedIndex={focusedIndex}
          onMediaClick={handleMediaClick}
          onColumnsChange={setNumCols}
          itemsRef={itemsRef}
          onItemCountChange={setItemCount}
        />
      </div>

      {preview && (
        <MediaPreview
          media={preview}
          list={itemsRef.current}
          onClose={() => setPreview(null)}
          onNavigate={handlePreviewNavigate}
        />
      )}
    </div>
  );
}
