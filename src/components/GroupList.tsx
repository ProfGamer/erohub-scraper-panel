import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { deleteGroup, fetchGroups, triggerGroupFetch } from "../api/groups";

function fmtCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export default function GroupList() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: groups, isLoading } = useQuery({ queryKey: ["groups"], queryFn: fetchGroups });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteGroup(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["groups"] }),
  });

  const fetchMutation = useMutation({
    mutationFn: (id: number) => triggerGroupFetch(id),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{
            borderColor: "var(--border-primary)",
            borderTopColor: "var(--accent-pink)",
          }}
        />
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <div style={{ color: "var(--text-muted)" }}>{t("groups.list.empty")}</div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {groups.map((g) => (
        <div
          key={g.id}
          className="card-glow rounded-2xl p-5 border transition-all duration-300 hover:translate-y-[-2px]"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border-primary)",
          }}
        >
          {/* Top section: icon + name + description */}
          <div className="flex items-start gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
              style={{
                background: "var(--accent-pink-muted)",
                color: "var(--accent-pink)",
              }}
            >
              {g.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <Link
                to={`/groups/${g.id}`}
                className="text-lg font-semibold hover:underline block truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {g.name}
              </Link>
              {g.description && (
                <div className="text-sm truncate" style={{ color: "var(--text-muted)" }}>
                  {g.description}
                </div>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div
            className="grid grid-cols-3 gap-2 rounded-xl p-3 mb-4"
            style={{ background: "var(--bg-primary)" }}
          >
            <div className="text-center">
              <div className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{t("groups.list.stats.authors")}</div>
              <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                {fmtCount(g.author_count)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{t("groups.list.stats.posts")}</div>
              <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                {fmtCount(g.post_count)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{t("groups.list.stats.media")}</div>
              <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                {fmtCount(g.media_count)}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => fetchMutation.mutate(g.id)}
              disabled={fetchMutation.isPending}
              className="btn-glow flex-1 text-sm px-3 py-2 rounded-lg font-semibold text-white transition-all duration-200 hover:brightness-110 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: "var(--gradient-primary)" }}
            >
              {fetchMutation.isPending && (
                <div
                  className="w-4 h-4 border-2 rounded-full animate-spin"
                  style={{
                    borderColor: "rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                  }}
                />
              )}
              {t("groups.list.fetchAll")}
            </button>
            <button
              onClick={() => {
                if (confirm(t("groups.list.deleteConfirm", { name: g.name }))) {
                  deleteMutation.mutate(g.id);
                }
              }}
              className="text-sm px-3 py-2 rounded-lg font-semibold transition-all duration-200 hover:brightness-110"
              style={{
                color: "var(--status-error)",
                border: "1px solid var(--status-error)",
                background: "transparent",
              }}
            >
              {t("common.delete")}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
