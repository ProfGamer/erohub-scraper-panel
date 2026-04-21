import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { deleteAuthor, triggerFetch, updateAuthor } from "../api/authors";
import type { Author } from "../types";

function formatCount(n: number | null | undefined): string {
  if (n == null) return "--";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export default function AuthorCard({ author }: { author: Author }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const fetchMutation = useMutation({ mutationFn: () => triggerFetch(author.id) });
  const toggleMutation = useMutation({
    mutationFn: () => updateAuthor(author.id, { status: author.status === "active" ? "paused" : "active" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["authors"] }),
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteAuthor(author.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["authors"] }),
  });

  const statusStyle =
    author.status === "active"
      ? { background: "var(--badge-active-bg)", color: "var(--badge-active-text)" }
      : author.status === "paused"
        ? { background: "var(--badge-paused-bg)", color: "var(--badge-paused-text)" }
        : { background: "var(--badge-error-bg)", color: "var(--badge-error-text)" };

  const profileUrl = `https://x.com/${author.username}`;

  return (
    <div
      className="card-glow rounded-2xl p-5 border transition-colors duration-300 flex flex-col"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border-primary)" }}
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 group">
          {author.profile_image ? (
            <img src={author.profile_image} alt="" className="w-14 h-14 rounded-full object-cover group-hover:opacity-80 transition-opacity" />
          ) : (
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl group-hover:opacity-80 transition-opacity"
              style={{ background: "var(--gradient-primary)" }}
            >
              {author.display_name?.[0] || author.username[0]}
            </div>
          )}
        </a>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-base hover:underline truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {author.display_name || author.username}
            </a>
            <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={statusStyle}>{t(`authors.card.status.${author.status as "active" | "paused" | "error"}`)}</span>
          </div>
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm hover:underline"
            style={{ color: "var(--text-muted)" }}
          >
            @{author.username}
          </a>
        </div>
      </div>

      {/* Bio & Location — fixed height so stats always align */}
      <div className="mt-3 h-[60px] overflow-hidden">
        {author.bio && (
          <p className="text-[13px] leading-relaxed line-clamp-2" style={{ color: "var(--text-secondary)" }}>
            {author.bio}
          </p>
        )}
        {author.location && (
          <div className="flex items-center gap-1 text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            <svg viewBox="0 0 24 24" className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            <span className="truncate">{author.location}</span>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div
        className="grid grid-cols-4 gap-1 mt-3 rounded-lg p-3"
        style={{ background: "var(--bg-primary)" }}
      >
        <div className="text-center">
          <div className="text-xs flex items-center justify-center gap-1" style={{ color: "var(--text-muted)" }}>
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
            {t("authors.card.stats.followers")}
          </div>
          <div className="text-sm font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>{formatCount(author.followers_count)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs flex items-center justify-center gap-1" style={{ color: "var(--text-muted)" }}>
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
            {t("authors.card.stats.likes")}
          </div>
          <div className="text-sm font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>{formatCount(author.favourites_count)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs flex items-center justify-center gap-1" style={{ color: "var(--text-muted)" }}>
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
            {t("authors.card.stats.posts")}
          </div>
          <div className="text-sm font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>{formatCount(author.statuses_count)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs flex items-center justify-center gap-1" style={{ color: "var(--text-muted)" }}>
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 3v18" /></svg>
            {t("authors.card.stats.media")}
          </div>
          <div className="text-sm font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>{formatCount(author.media_count)}</div>
        </div>
      </div>

      {/* Spacer pushes actions to bottom */}
      <div className="flex-1" />

      {/* Last fetched */}
      {author.last_fetched_at && (
        <div className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
          {t("authors.card.lastFetched", { when: new Date(author.last_fetched_at).toLocaleString() })}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => fetchMutation.mutate()}
          disabled={fetchMutation.isPending}
          className="btn-glow text-sm text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
          style={{ background: "var(--gradient-primary)" }}
        >
          {fetchMutation.isPending && (
            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
            </svg>
          )}
          {fetchMutation.isPending ? t("authors.card.fetching") : t("authors.card.fetchNow")}
        </button>
        <button
          onClick={() => toggleMutation.mutate()}
          className="text-sm px-3 py-1.5 rounded-lg border transition-colors"
          style={{ borderColor: "var(--border-primary)", color: "var(--text-secondary)", background: "var(--bg-primary)" }}
        >
          {author.status === "active" ? t("authors.card.pause") : t("authors.card.resume")}
        </button>
        <button
          onClick={() => deleteMutation.mutate()}
          className="text-sm ml-auto transition-colors hover:opacity-80"
          style={{ color: "var(--badge-error-text)" }}
        >
          {t("common.delete")}
        </button>
      </div>
    </div>
  );
}
