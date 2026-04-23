import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { deletePostBatch, fetchPosts } from "../api/media";
import FilterBar from "../components/FilterBar";
import MasonryGrid from "../components/MasonryGrid";
import MediaPreview from "../components/MediaPreview";
import PostCard from "../components/PostCard";
import { useGridNav } from "../hooks/useGridNav";
import { useIntersection } from "../hooks/useIntersection";
import type { MediaItem, Post } from "../types";

const PAGE_SIZE = 20;

interface PreviewState {
  postIndex: number;
  mediaIndex: number;
}

export default function PostsPage() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<{ type?: string; group_id?: number; author_id?: string }>({});
  const [numCols, setNumCols] = useState(2);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => { setSelectMode(false); setSelected(new Set()); };

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => deletePostBatch(ids),
    onSuccess: () => {
      exitSelectMode();
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["media"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["posts", filters],
    queryFn: ({ pageParam }) =>
      fetchPosts({ author_id: filters.author_id, group_id: filters.group_id, page: pageParam, size: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.pages ? last.page + 1 : undefined),
  });

  const sentinelRef = useIntersection(() => fetchNextPage(), hasNextPage === true && !isFetchingNextPage);
  const posts = data?.pages.flatMap((p) => p.items) ?? [];

  const openPreview = useCallback((postIndex: number) => {
    const post = posts[postIndex];
    if (post?.media?.length) {
      setPreview({ postIndex, mediaIndex: 0 });
    }
  }, [posts]);

  const { focusedIndex, setFocus, resetFocus } = useGridNav({
    itemCount: posts.length,
    numCols,
    enabled: !preview,
    containerRef,
    onEnter: openPreview,
  });

  const handleMediaClick = useCallback((postIndex: number, media: MediaItem) => {
    const post = posts[postIndex];
    const mediaIndex = post?.media?.findIndex((m) => m.id === media.id) ?? 0;
    setFocus(postIndex);
    setPreview({ postIndex, mediaIndex: Math.max(0, mediaIndex) });
  }, [posts, setFocus]);

  const currentPost = preview ? posts[preview.postIndex] : null;
  const currentMedia = currentPost?.media?.[preview?.mediaIndex ?? 0] ?? null;
  const currentPostMedia = currentPost?.media ?? [];

  const activeIdx = preview ? preview.postIndex : focusedIndex;
  if (activeIdx >= 0 && posts.length - activeIdx <= 5 && hasNextPage && !isFetchingNextPage) {
    fetchNextPage();
  }

  const handlePreviewNavigate = useCallback((media: MediaItem) => {
    if (!preview || !currentPost) return;
    const newMediaIndex = currentPostMedia.findIndex((m) => m.id === media.id);
    if (newMediaIndex >= 0) {
      setPreview({ ...preview, mediaIndex: newMediaIndex });
      return;
    }
    // Media not in current post — this shouldn't happen with left/right within list
  }, [preview, currentPost, currentPostMedia]);

  const handlePreviewPrev = useCallback(() => {
    if (!preview) return;
    if (preview.mediaIndex > 0) {
      setPreview({ ...preview, mediaIndex: preview.mediaIndex - 1 });
    } else if (preview.postIndex > 0) {
      const prevPost = posts[preview.postIndex - 1];
      const prevMedia = prevPost?.media ?? [];
      if (prevMedia.length > 0) {
        const newPostIndex = preview.postIndex - 1;
        setFocus(newPostIndex);
        setPreview({ postIndex: newPostIndex, mediaIndex: prevMedia.length - 1 });
      }
    }
  }, [preview, posts, setFocus]);

  const handlePreviewNext = useCallback(() => {
    if (!preview) return;
    if (preview.mediaIndex < currentPostMedia.length - 1) {
      setPreview({ ...preview, mediaIndex: preview.mediaIndex + 1 });
    } else if (preview.postIndex < posts.length - 1) {
      const nextPost = posts[preview.postIndex + 1];
      if (nextPost?.media?.length) {
        const newPostIndex = preview.postIndex + 1;
        setFocus(newPostIndex);
        setPreview({ postIndex: newPostIndex, mediaIndex: 0 });
      }
    }
  }, [preview, currentPostMedia, posts, setFocus]);

  const handlePostUp = useCallback(() => {
    if (!preview || preview.postIndex <= 0) return;
    const newPostIndex = preview.postIndex - 1;
    const prevPost = posts[newPostIndex];
    if (prevPost?.media?.length) {
      setFocus(newPostIndex);
      setPreview({ postIndex: newPostIndex, mediaIndex: 0 });
    }
  }, [preview, posts, setFocus]);

  const handlePostDown = useCallback(() => {
    if (!preview || preview.postIndex >= posts.length - 1) return;
    const newPostIndex = preview.postIndex + 1;
    const nextPost = posts[newPostIndex];
    if (nextPost?.media?.length) {
      setFocus(newPostIndex);
      setPreview({ postIndex: newPostIndex, mediaIndex: 0 });
    }
  }, [preview, posts, setFocus]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{t("pages.posts.title")}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => selectMode ? exitSelectMode() : setSelectMode(true)}
            className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${selectMode ? "text-white" : ""}`}
            style={
              selectMode
                ? { background: "var(--gradient-primary)", borderColor: "transparent", color: "#fff" }
                : { background: "var(--bg-surface)", color: "var(--text-secondary)", borderColor: "var(--border-primary)" }
            }
          >
            {selectMode ? t("pages.posts.cancel") : t("pages.posts.select")}
          </button>
          {selected.size > 0 && (
            <>
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>{t("pages.posts.selectedCount", { count: selected.size })}</span>
              <button
                onClick={() => {
                  const msg = t("pages.posts.deleteConfirm", { count: selected.size });
                  if (window.confirm(msg)) {
                    deleteMutation.mutate(Array.from(selected));
                  }
                }}
                disabled={deleteMutation.isPending}
                className="text-sm px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
                style={{ background: "var(--badge-error-text)" }}
              >
                {deleteMutation.isPending ? t("pages.posts.deleting") : t("pages.posts.deleteSelected")}
              </button>
            </>
          )}
          {data && <span className="text-sm" style={{ color: "var(--text-muted)" }}>{t("pages.posts.totalCount", { count: data.pages[0]?.total ?? 0 })}</span>}
        </div>
      </div>
      <FilterBar filters={filters} onChange={(f) => { setFilters(f); resetFocus(); setPreview(null); exitSelectMode(); }} />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 border-4 rounded-full animate-spin" style={{ borderColor: "var(--border-primary)", borderTopColor: "var(--accent-pink)" }} />
        </div>
      ) : posts.length === 0 ? (
        <div className="mt-8 text-center" style={{ color: "var(--text-muted)" }}>{t("pages.posts.emptyState")}</div>
      ) : (
        <div className="mt-4" ref={containerRef}>
          <MasonryGrid
            items={posts}
            columnCounts={{ base: 1, md: 1, lg: 2 }}
            gap={16}
            keyExtractor={(p) => p.id}
            onColumnsChange={setNumCols}
            renderItem={(post: Post, index: number) => (
              <div
                className="rounded-2xl transition-shadow duration-200"
                style={!selectMode && focusedIndex === index ? {
                  boxShadow: "0 0 0 2px var(--accent-pink), 0 0 12px rgba(236, 72, 153, 0.2)",
                } : undefined}
                onClick={() => !selectMode && setFocus(index)}
              >
                <PostCard
                  post={post}
                  media={post.media || []}
                  selectMode={selectMode}
                  selected={selected.has(post.id)}
                  onSelect={() => toggleSelect(post.id)}
                  onMediaClick={(m) => handleMediaClick(index, m)}
                />
              </div>
            )}
          />
        </div>
      )}

      <div ref={sentinelRef} className="h-1" />
      {isFetchingNextPage && (
        <div className="flex justify-center py-6">
          <div className="h-6 w-6 border-3 rounded-full animate-spin" style={{ borderColor: "var(--border-primary)", borderTopColor: "var(--accent-pink)" }} />
        </div>
      )}

      {preview && currentMedia && currentPost && (
        <MediaPreview
          media={currentMedia}
          list={currentPostMedia}
          post={currentPost}
          onClose={() => setPreview(null)}
          onNavigate={handlePreviewNavigate}
          onPostUp={handlePostUp}
          onPostDown={handlePostDown}
          onOverflowPrev={handlePreviewPrev}
          onOverflowNext={handlePreviewNext}
        />
      )}
    </div>
  );
}
