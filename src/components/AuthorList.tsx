import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchAuthors } from "../api/authors";
import type { Author } from "../types";
import AuthorCard from "./AuthorCard";

type SortKey = "name" | "followers" | "media" | "posts" | "recent" | "status";

const SORT_OPTIONS: { key: SortKey; labelKey: "authors.list.sort.name" | "authors.list.sort.followers" | "authors.list.sort.media" | "authors.list.sort.posts" | "authors.list.sort.recent" | "authors.list.sort.status" }[] = [
  { key: "name", labelKey: "authors.list.sort.name" },
  { key: "followers", labelKey: "authors.list.sort.followers" },
  { key: "media", labelKey: "authors.list.sort.media" },
  { key: "posts", labelKey: "authors.list.sort.posts" },
  { key: "recent", labelKey: "authors.list.sort.recent" },
  { key: "status", labelKey: "authors.list.sort.status" },
];

function sortAuthors(authors: Author[], key: SortKey, asc: boolean): Author[] {
  const sorted = [...authors].sort((a, b) => {
    switch (key) {
      case "name":
        return (a.display_name || a.username).localeCompare(b.display_name || b.username);
      case "followers":
        return (b.followers_count ?? 0) - (a.followers_count ?? 0);
      case "media":
        return (b.media_count ?? 0) - (a.media_count ?? 0);
      case "posts":
        return (b.statuses_count ?? 0) - (a.statuses_count ?? 0);
      case "recent": {
        const ta = a.last_fetched_at ? new Date(a.last_fetched_at).getTime() : 0;
        const tb = b.last_fetched_at ? new Date(b.last_fetched_at).getTime() : 0;
        return tb - ta;
      }
      case "status": {
        const order: Record<string, number> = { active: 0, paused: 1, error: 2 };
        return (order[a.status] ?? 3) - (order[b.status] ?? 3);
      }
    }
  });
  return asc && key !== "name" ? sorted.reverse() : key === "name" && !asc ? sorted.reverse() : sorted;
}

export default function AuthorList({ groupId }: { groupId?: number }) {
  const { t } = useTranslation();
  const { data: authors, isLoading } = useQuery({ queryKey: ["authors", { groupId }], queryFn: () => fetchAuthors(groupId) });
  const [sortKey, setSortKey] = useState<SortKey>("followers");
  const [asc, setAsc] = useState(false);

  const sorted = useMemo(
    () => authors ? sortAuthors(authors, sortKey, asc) : [],
    [authors, sortKey, asc],
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: "var(--border-primary)", borderTopColor: "var(--accent-pink)" }} />
      </div>
    );
  }

  return (
    <div>
      {authors && authors.length > 1 && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{t("authors.list.sortBy")}</span>
          <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "var(--bg-primary)" }}>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => {
                  if (sortKey === opt.key) setAsc((v) => !v);
                  else { setSortKey(opt.key); setAsc(false); }
                }}
                className="px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 flex items-center gap-1"
                style={sortKey === opt.key
                  ? { background: "var(--gradient-primary)", color: "#fff" }
                  : { color: "var(--text-muted)" }
                }
              >
                {t(opt.labelKey)}
                {sortKey === opt.key && (
                  <svg viewBox="0 0 12 12" className="w-3 h-3" fill="currentColor">
                    {asc
                      ? <path d="M6 2l4 5H2z" />
                      : <path d="M6 10l4-5H2z" />
                    }
                  </svg>
                )}
              </button>
            ))}
          </div>
          <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>{t("authors.list.count", { count: authors.length })}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((a) => <AuthorCard key={a.id} author={a} />)}
        {sorted.length === 0 && <div style={{ color: "var(--text-muted)" }}>{t("authors.list.empty")}</div>}
      </div>
    </div>
  );
}
