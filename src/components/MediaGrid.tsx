import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { deleteMediaBatch, fetchMedia, mediaFileUrl, mediaThumbnailUrl } from "../api/media";
import { useTheme } from "../contexts/ThemeContext";
import { useIntersection } from "../hooks/useIntersection";
import type { MediaItem } from "../types";
import MasonryGrid from "./MasonryGrid";

interface Props {
  type?: string;
  authorId?: string;
  groupId?: number;
  focusedIndex?: number;
  onMediaClick?: (media: MediaItem, index: number) => void;
  onColumnsChange?: (cols: number) => void;
  itemsRef?: React.MutableRefObject<MediaItem[]>;
  onItemCountChange?: (count: number) => void;
  onLoadMore?: () => void;
}

const PAGE_SIZE = 30;

const TEASERS = [
  "想看更多吗？", "点我就对了...", "别害羞~", "你在偷看什么？",
  "还不点开？", "好想被打开...", "忍不住了吧", "就差一步了~",
  "想要吗？", "来嘛~", "不许走！", "再靠近一点...",
  "好痒...", "快点进来~", "人家等你好久了", "你的手在抖哦",
  "按下去吧...", "想被看到...", "不要停...", "就是这里~",
];

export default function MediaGrid({ type, authorId, groupId, focusedIndex = -1, onMediaClick, onColumnsChange, itemsRef, onItemCountChange, onLoadMore }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { theme, nsfw } = useTheme();
  const isBold = theme === "bold";
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["media", { type, authorId, groupId }],
    queryFn: ({ pageParam }) =>
      fetchMedia({ type, author_id: authorId, group_id: groupId, page: pageParam, size: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.pages ? last.page + 1 : undefined),
  });

  const sentinelRef = useIntersection(() => fetchNextPage(), hasNextPage === true && !isFetchingNextPage);

  const deleteMutation = useMutation({
    mutationFn: (ids: number[]) => deleteMediaBatch(ids),
    onSuccess: () => {
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ["media"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => { setSelectMode(false); setSelected(new Set()); };

  const items = data?.pages.flatMap((p) => p.items) ?? [];
  if (itemsRef) itemsRef.current = items;

  const prevCountRef = useRef(0);
  if (items.length !== prevCountRef.current) {
    prevCountRef.current = items.length;
    onItemCountChange?.(items.length);
  }

  if (focusedIndex >= 0 && items.length - focusedIndex <= 10 && hasNextPage && !isFetchingNextPage) {
    onLoadMore ? onLoadMore() : fetchNextPage();
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div
          className="h-8 w-8 border-4 rounded-full animate-spin"
          style={{ borderColor: "var(--border-primary)", borderTopColor: "var(--accent-pink)" }}
        />
      </div>
    );
  }
  if (items.length === 0) return <div style={{ color: "var(--text-muted)" }}>{t("mediaGrid.empty")}</div>;

  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => selectMode ? exitSelectMode() : setSelectMode(true)}
          className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${selectMode ? "text-white" : ""}`}
          style={
            selectMode
              ? { background: "var(--gradient-primary)", borderColor: "transparent", color: "#fff" }
              : { background: "var(--bg-surface)", color: "var(--text-secondary)", borderColor: "var(--border-primary)" }
          }
        >
          {selectMode ? t("mediaGrid.cancel") : t("mediaGrid.select")}
        </button>
        {selected.size > 0 && (
          <>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>{t("mediaGrid.selectedCount", { count: selected.size })}</span>
            <button
              onClick={() => {
                const msg = t("mediaGrid.deleteConfirm", { count: selected.size });
                if (window.confirm(msg)) {
                  deleteMutation.mutate(Array.from(selected));
                }
              }}
              disabled={deleteMutation.isPending}
              className="text-sm px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
              style={{ background: "var(--badge-error-text)" }}
            >
              {deleteMutation.isPending ? t("mediaGrid.deleting") : t("mediaGrid.deleteSelected")}
            </button>
          </>
        )}
        {data && <span className="text-sm ml-auto" style={{ color: "var(--text-muted)" }}>{t("mediaGrid.fileCount", { count: data.pages[0]?.total ?? 0 })}</span>}
      </div>

      <MasonryGrid
        items={items}
        columnCounts={isBold ? { base: 1, md: 2, lg: 3 } : { base: 2, md: 4, lg: 5 }}
        gap={isBold ? 16 : 8}
        keyExtractor={(m) => m.id}
        onColumnsChange={onColumnsChange}
        renderItem={(m, index) => (
          <div
            className={`overflow-hidden cursor-pointer relative group ${
              isBold
                ? "rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:z-10"
                : "rounded-lg transition-all duration-200"
            } ${selectMode && selected.has(m.id) ? "ring-2 opacity-90" : "hover:opacity-90"}`}
            style={{
              background: "var(--bg-primary)",
              ...(selectMode && selected.has(m.id) ? { ringColor: "var(--accent-pink)" } : {}),
              ...(focusedIndex === index ? {
                boxShadow: "0 0 0 2px var(--accent-pink), 0 0 20px rgba(236, 72, 153, 0.4), 0 0 40px rgba(6, 182, 212, 0.15)",
                transform: "scale(1.03)",
                zIndex: 10,
              } : {}),
            }}
            onClick={() => selectMode ? toggleSelect(m.id) : onMediaClick?.(m, index)}
          >
            {m.type === "video" && (
              <>
                {/* Center play button */}
                <div className="absolute inset-0 flex items-center justify-center z-[4] pointer-events-none">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-sm group-hover:scale-110 transition-transform">
                    <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5 ml-0.5"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                </div>
                {/* Bottom gradient bar with VIDEO label */}
                <div className="absolute bottom-0 left-0 right-0 z-[4] px-2 py-1.5 flex items-center gap-1.5" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.6))" }}>
                  <svg viewBox="0 0 24 24" className="w-3 h-3 text-white/70" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>
                  <span className="text-[10px] text-white/70 font-medium">{t("mediaGrid.videoBadge")}</span>
                </div>
              </>
            )}
            {selectMode && selected.has(m.id) && (
              <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center z-10" style={{ background: "var(--accent-pink)" }}>
                <span className="text-white text-xs">&#10003;</span>
              </div>
            )}
            <img src={m.type === "video" ? mediaThumbnailUrl(m.id) : mediaFileUrl(m.id)} alt="" className={`w-full block${nsfw ? "" : " sfw-blur"}`} loading="lazy" />

            {focusedIndex === index && (
              <div key={`teaser-${index}`} className="absolute bottom-4 left-0 right-0 flex justify-center z-10 teaser-float">
                <span className="text-sm font-medium text-white/80" style={{ textShadow: "0 0 12px var(--accent-pink), 0 0 24px var(--accent-cyan)" }}>
                  {TEASERS[index % TEASERS.length]}
                </span>
              </div>
            )}

            {isBold && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            )}
          </div>
        )}
      />

      <div ref={sentinelRef} className="h-1" />
      {isFetchingNextPage && (
        <div className="flex justify-center py-6">
          <div
            className="h-6 w-6 border-3 rounded-full animate-spin"
            style={{ borderColor: "var(--border-primary)", borderTopColor: "var(--accent-pink)" }}
          />
        </div>
      )}
    </>
  );
}

export { type Props as MediaGridProps };
