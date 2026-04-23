import { mediaFileUrl, mediaThumbnailUrl } from "../api/media";
import { useTheme } from "../contexts/ThemeContext";
import type { Post, MediaItem } from "../types";

interface Props {
  post: Post;
  media: MediaItem[];
  selectMode?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onMediaClick?: (media: MediaItem) => void;
}

export default function PostCard({ post, media, selectMode, selected, onSelect, onMediaClick }: Props) {
  const { nsfw } = useTheme();

  const author = post.author;
  const displayName = author?.display_name || author?.username || "Unknown";
  const handle = author?.username ? `@${author.username}` : "";
  const avatarUrl = author?.profile_image;
  const profileUrl = author?.username ? `https://x.com/${author.username}` : undefined;
  const tweetUrl = author?.username ? `https://x.com/${author.username}/status/${post.id}` : undefined;
  const timeAgo = post.posted_at ? formatRelativeTime(post.posted_at) : "";
  const fullDate = post.posted_at ? new Date(post.posted_at).toLocaleString() : "";

  return (
    <>
      <article
        className={`card-glow rounded-2xl border transition-colors duration-300 relative ${selectMode ? "cursor-pointer" : ""}`}
        style={{
          background: "var(--bg-surface)",
          borderColor: selected ? "var(--accent-pink)" : "var(--border-primary)",
          ...(selected ? { boxShadow: "0 0 0 2px var(--accent-pink)" } : {}),
        }}
        onClick={selectMode ? onSelect : undefined}
      >
        {selectMode && (
          <div
            className="absolute top-3 left-3 w-6 h-6 rounded-full flex items-center justify-center z-10 border-2 transition-colors"
            style={selected
              ? { background: "var(--accent-pink)", borderColor: "var(--accent-pink)" }
              : { background: "var(--bg-surface)", borderColor: "var(--border-primary)" }
            }
          >
            {selected && <span className="text-white text-xs font-bold">&#10003;</span>}
          </div>
        )}
        <div className="p-4">
          {/* Author header */}
          <div className="flex gap-3">
            {/* Avatar — clickable to X profile */}
            <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 group">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover group-hover:opacity-80 transition-opacity" />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm group-hover:opacity-80 transition-opacity"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {displayName[0]?.toUpperCase()}
                </div>
              )}
            </a>

            <div className="flex-1 min-w-0">
              {/* Name row */}
              <div className="flex items-center gap-1">
                <a
                  href={profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[15px] truncate hover:underline"
                  style={{ color: "var(--text-primary)" }}
                >
                  {displayName}
                </a>
                {handle && <span className="text-[14px] truncate" style={{ color: "var(--text-muted)" }}>{handle}</span>}
                {timeAgo && (
                  <>
                    <span style={{ color: "var(--text-muted)" }}>·</span>
                    <a
                      href={tweetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] hover:underline flex-shrink-0"
                      style={{ color: "var(--text-muted)" }}
                      title={fullDate}
                    >
                      {timeAgo}
                    </a>
                  </>
                )}
              </div>

              {/* Tweet text — prominent */}
              {post.text && (
                <div
                  className="mt-1.5 rounded-xl px-3 py-2.5 border"
                  style={{ background: "var(--bg-primary)", borderColor: "var(--border-subtle)" }}
                >
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words" style={{ color: "var(--text-secondary)" }}>{post.text}</p>
                </div>
              )}

              {/* Media */}
              {media.length > 0 && (
                <div
                  className={`mt-3 rounded-2xl overflow-hidden border ${mediaGridClass(media.length)}`}
                  style={{ borderColor: "var(--border-primary)" }}
                >
                  {media.slice(0, 4).map((m, i) => (
                    <div
                      key={m.id}
                      className={`relative cursor-pointer overflow-hidden ${mediaCellClass(media.length, i)}`}
                      style={{ background: "var(--bg-primary)" }}
                      onClick={(e) => { if (selectMode) { e.stopPropagation(); onSelect?.(); } else { onMediaClick?.(m); } }}
                    >
                      <img
                        src={m.type === "video" ? mediaThumbnailUrl(m.id) : mediaFileUrl(m.id)}
                        alt=""
                        className={`w-full h-full object-cover${nsfw ? "" : " sfw-blur"}`}
                        loading="lazy"
                      />
                      {m.type === "video" && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-11 h-11 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5 ml-0.5"><path d="M8 5v14l11-7z" /></svg>
                          </div>
                        </div>
                      )}
                      {media.length > 4 && i === 3 && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-white text-xl font-bold">+{media.length - 4}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Footer stats */}
              <div className="flex items-center justify-between mt-3 -mx-2 text-[13px]" style={{ color: "var(--text-muted)" }}>
                <button type="button" className="group flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-blue-50 hover:text-blue-500 transition-all duration-200">
                  <div className="p-1 rounded-full group-hover:bg-blue-100 transition-colors duration-200">
                    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>
                  </div>
                  <span className="text-[13px] font-medium">{fmtCount(post.reply_count)}</span>
                </button>
                <button type="button" className="group flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-emerald-50 hover:text-emerald-500 transition-all duration-200">
                  <div className="p-1 rounded-full group-hover:bg-emerald-100 transition-colors duration-200">
                    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" /></svg>
                  </div>
                  <span className="text-[13px] font-medium">{fmtCount(post.retweet_count)}</span>
                </button>
                <button type="button" className="group flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-pink-50 hover:text-pink-500 transition-all duration-200">
                  <div className="p-1 rounded-full group-hover:bg-pink-100 transition-colors duration-200">
                    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
                  </div>
                  <span className="text-[13px] font-medium">{fmtCount(post.favorite_count)}</span>
                </button>
                <span className="group flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-sky-50 hover:text-sky-500 transition-all duration-200">
                  <div className="p-1 rounded-full group-hover:bg-sky-100 transition-colors duration-200">
                    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
                  </div>
                  <span className="text-[13px] font-medium">{fmtCount(post.view_count)}</span>
                </span>
                {tweetUrl && (
                  <a href={tweetUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center px-2 py-1 rounded-full hover:bg-blue-50 hover:text-blue-500 transition-all duration-200">
                    <div className="p-1 rounded-full group-hover:bg-blue-100 transition-colors duration-200">
                      <svg viewBox="0 0 24 24" className="w-[16px] h-[16px]" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                    </div>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>

    </>
  );
}

function fmtCount(n: number | null | undefined): string {
  if (n == null) return "--";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function mediaGridClass(count: number): string {
  if (count === 1) return "";
  if (count === 2) return "grid grid-cols-2 gap-[2px]";
  return "grid grid-cols-2 grid-rows-2 gap-[2px]";
}

function mediaCellClass(total: number, index: number): string {
  if (total === 1) return "aspect-[16/9]";
  if (total === 3 && index === 0) return "row-span-2";
  return "aspect-square";
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
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
