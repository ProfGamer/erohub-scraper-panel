import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { mediaFileUrl } from "../api/media";
import { useZoomPan } from "../hooks/useZoomPan";
import type { MediaItem, Post } from "../types";

interface Props {
  media: MediaItem;
  list?: MediaItem[];
  post?: Post;
  onClose: () => void;
  onNavigate?: (media: MediaItem) => void;
  onPostUp?: () => void;
  onPostDown?: () => void;
  onOverflowPrev?: () => void;
  onOverflowNext?: () => void;
}

function fmtCount(n: number | null | undefined): string {
  if (n == null) return "--";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function MediaPreview({ media, list, post, onClose, onNavigate, onPostUp, onPostDown, onOverflowPrev, onOverflowNext }: Props) {
  const { t } = useTranslation();
  const zoom = useZoomPan();
  const currentIndex = list?.findIndex((m) => m.id === media.id) ?? -1;
  const hasPrev = list && currentIndex > 0;
  const hasNext = list && currentIndex >= 0 && currentIndex < list.length - 1;

  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  const goPrev = useCallback(() => {
    if (hasPrev && onNavigate) { zoom.reset(); onNavigate(list![currentIndex - 1]); }
    else if (!hasPrev && onOverflowPrev) { zoom.reset(); onOverflowPrev(); }
  }, [hasPrev, onNavigate, onOverflowPrev, list, currentIndex, zoom]);

  const goNext = useCallback(() => {
    if (hasNext && onNavigate) { zoom.reset(); onNavigate(list![currentIndex + 1]); }
    else if (!hasNext && onOverflowNext) { zoom.reset(); onOverflowNext(); }
  }, [hasNext, onNavigate, onOverflowNext, list, currentIndex, zoom]);

  const togglePlay = useCallback(() => { const v = videoRef.current; if (!v) return; if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); } }, []);
  const toggleMute = useCallback(() => { const v = videoRef.current; if (!v) return; v.muted = !v.muted; setMuted(v.muted); }, []);
  const toggleFullscreen = useCallback(() => { const v = videoRef.current; if (!v) return; if (document.fullscreenElement) document.exitFullscreen(); else v.requestFullscreen(); }, []);
  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => { const v = videoRef.current; if (!v || !duration) return; const rect = e.currentTarget.getBoundingClientRect(); v.currentTime = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * duration; }, [duration]);

  const isVideo = media.type === "video";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") { e.preventDefault(); onClose(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); goNext(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); onPostUp?.(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); onPostDown?.(); }
      else if (e.key === " " && isVideo) { e.preventDefault(); togglePlay(); }
      else if (e.key === "j" && isVideo) { if (videoRef.current) videoRef.current.currentTime -= 5; }
      else if (e.key === "l" && isVideo) { if (videoRef.current) videoRef.current.currentTime += 5; }
      else if (e.key === "m" && isVideo) toggleMute();
      else if (e.key === "f" && isVideo) toggleFullscreen();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, goPrev, goNext, togglePlay, toggleMute, toggleFullscreen]);

  useEffect(() => { zoom.reset(); setPlaying(true); setCurrentTime(0); setDuration(0); }, [media.id]);

  const handleBackdropWheel = useCallback((e: React.WheelEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-media-content]")) return;
    e.preventDefault();
    if (e.deltaY > 0) goNext();
    else if (e.deltaY < 0) goPrev();
  }, [goNext, goPrev]);

  const counter = list && currentIndex >= 0 ? `${currentIndex + 1} / ${list.length}` : null;
  const author = post?.author;

  const mediaViewer = (
    <div data-media-content>
      {isVideo ? (
        <div className="relative rounded-xl overflow-hidden" style={{ background: "#000" }}>
          <video
            ref={videoRef} src={mediaFileUrl(media.id)} autoPlay
            className={post ? "max-h-[85vh] max-w-full block" : "max-h-[85vh] max-w-[90vw] block"}
            onClick={togglePlay}
            onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
            onLoadedMetadata={() => videoRef.current && setDuration(videoRef.current.duration)}
            onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
            onVolumeChange={() => { if (videoRef.current) { setVolume(videoRef.current.volume); setMuted(videoRef.current.muted); } }}
          />
          <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-8" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.8))" }}>
            <div className="h-1 rounded-full mb-3 cursor-pointer group" style={{ background: "rgba(255,255,255,0.2)" }} onClick={seek}>
              <div className="h-full rounded-full relative transition-[width] duration-100" style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%", background: "var(--accent-pink)" }}>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "var(--accent-pink)" }} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={togglePlay} className="text-white hover:opacity-80 transition-opacity">
                {playing ? <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>
                  : <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>}
              </button>
              <span className="text-xs text-white/70 tabular-nums min-w-[70px]">{fmtTime(currentTime)} / {fmtTime(duration)}</span>
              <button onClick={toggleMute} className="text-white hover:opacity-80 transition-opacity">
                {muted || volume === 0
                  ? <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 5L6 9H2v6h4l5 4V5z" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
                  : <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 5L6 9H2v6h4l5 4V5z" /><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" /></svg>}
              </button>
              <div className="flex-1" />
              <button onClick={toggleFullscreen} className="text-white hover:opacity-80 transition-opacity">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" /></svg>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl select-none" style={{ touchAction: "none" }} {...zoom.handlers}>
          <img
            src={mediaFileUrl(media.id)} alt=""
            className={post ? "max-h-[85vh] max-w-full block" : "max-h-[85vh] max-w-[90vw] block"}
            style={zoom.style} draggable={false}
          />
        </div>
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "var(--overlay-bg)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onWheel={handleBackdropWheel}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-10">
        <div className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
          {counter}
          {media.width && media.height && <span className="ml-3">{media.width} x {media.height}</span>}
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
          style={{ background: "rgba(255,255,255,0.1)", color: "var(--text-primary)" }}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Nav arrows — only shown in non-post (Browse) mode */}
      {!post && hasPrev && (
        <button onClick={(e) => { e.stopPropagation(); goPrev(); }} className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ background: "rgba(255,255,255,0.1)", color: "var(--text-primary)", backdropFilter: "blur(4px)" }}>
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
      )}
      {!post && hasNext && (
        <button onClick={(e) => { e.stopPropagation(); goNext(); }} className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ background: "rgba(255,255,255,0.1)", color: "var(--text-primary)", backdropFilter: "blur(4px)" }}>
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>
      )}

      {post ? (
        /* Two-column layout for Posts preview */
        <>
          {/* Left: Post info panel — fixed position */}
          <div
            className="absolute left-4 top-14 bottom-4 w-80 rounded-2xl border p-5 overflow-y-auto z-10"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border-primary)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Author */}
            {author && (
              <div className="flex items-center gap-3 mb-4">
                {author.profile_image ? (
                  <img src={author.profile_image} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: "var(--gradient-primary)" }}>
                    {(author.display_name || author.username)?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                    {author.display_name || author.username}
                  </div>
                  <a
                    href={`https://x.com/${author.username}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-xs hover:underline" style={{ color: "var(--text-muted)" }}
                  >
                    @{author.username}
                  </a>
                </div>
                {post.posted_at && (
                  <span className="text-xs ml-auto flex-shrink-0" style={{ color: "var(--text-muted)" }} title={new Date(post.posted_at).toLocaleString()}>
                    {formatRelativeTime(post.posted_at)}
                  </span>
                )}
              </div>
            )}

            {/* Post text */}
            {post.text && (
              <div className="rounded-xl px-3 py-2.5 border mb-4" style={{ background: "var(--bg-primary)", borderColor: "var(--border-subtle)" }}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ color: "var(--text-secondary)" }}>
                  {post.text}
                </p>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { icon: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z", value: post.reply_count },
                { icon: "M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3", value: post.retweet_count },
                { icon: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z", value: post.favorite_count },
                { icon: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z", value: post.view_count },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 mx-auto mb-1" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--text-muted)" }}>
                    <path d={s.icon} />
                    {i === 3 && <circle cx="12" cy="12" r="3" />}
                  </svg>
                  <div className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{fmtCount(s.value)}</div>
                </div>
              ))}
            </div>

            {/* Media thumbnails */}
            {list && list.length > 1 && (
              <div>
                <div className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>{t("mediaPreview.mediaSection", { count: list.length })}</div>
                <div className="grid grid-cols-4 gap-1.5">
                  {list.map((m) => (
                    <div
                      key={m.id}
                      className="aspect-square rounded-lg overflow-hidden cursor-pointer transition-all"
                      style={{
                        background: "var(--bg-primary)",
                        ...(m.id === media.id ? { boxShadow: "0 0 0 2px var(--accent-pink)" } : { opacity: 0.6 }),
                      }}
                      onClick={() => onNavigate?.(m)}
                    >
                      <img src={mediaFileUrl(m.id)} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Link to original */}
            {author?.username && (
              <a
                href={`https://x.com/${author.username}/status/${post.id}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs mt-4 hover:underline"
                style={{ color: "var(--accent-cyan)" }}
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                {t("mediaPreview.viewOnX")}
              </a>
            )}
          </div>

          {/* Right: Media viewer — offset to the right of the fixed panel */}
          <div
            className="absolute top-14 bottom-4 right-4 flex items-center justify-center"
            style={{ left: "calc(1rem + 320px + 1.5rem)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {(hasPrev || onOverflowPrev) && (
              <button onClick={goPrev} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ background: "rgba(255,255,255,0.1)", color: "var(--text-primary)" }}>
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
            )}
            <div className="max-h-full">{mediaViewer}</div>
            {(hasNext || onOverflowNext) && (
              <button onClick={goNext} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ background: "rgba(255,255,255,0.1)", color: "var(--text-primary)" }}>
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            )}
          </div>
        </>
      ) : (
        /* Single centered layout for Browse */
        <div className="max-w-[90vw] max-h-[90vh] relative" onClick={(e) => e.stopPropagation()}>
          {mediaViewer}
        </div>
      )}

      {/* Zoom indicator */}
      {!isVideo && zoom.state.scale > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}>
          {Math.round(zoom.state.scale * 100)}%
        </div>
      )}
    </div>
  );
}
