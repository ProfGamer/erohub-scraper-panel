import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { mediaFileUrl, mediaThumbnailUrl } from "../api/media";
import { useTheme } from "../contexts/ThemeContext";
import { fetchStats, fetchTopAuthors } from "../api/tasks";

function fmtBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function fmtCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return String(n);
}

const PERIODS = ["1d", "1w", "1m", "all"] as const;

export default function Dashboard() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<string>("all");
  const { nsfw } = useTheme();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
    refetchInterval: 10000,
  });

  const { data: topAuthors } = useQuery({
    queryKey: ["top-authors", period],
    queryFn: () => fetchTopAuthors(period),
  });

  if (statsLoading || !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="h-10 w-10 rounded-full border-4 animate-spin"
          style={{
            borderColor: "var(--border-primary)",
            borderTopColor: "var(--accent-pink)",
          }}
        />
      </div>
    );
  }

  const statCards = [
    {
      label: t("dashboard.stats.groups"),
      value: String(stats.total_groups),
      icon: "M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z",
    },
    {
      label: t("dashboard.stats.authors"),
      value: String(stats.total_authors),
      icon: "M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
    },
    {
      label: t("dashboard.stats.posts"),
      value: fmtCount(stats.total_posts),
      icon: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z",
    },
    {
      label: t("dashboard.stats.mediaFiles"),
      value: fmtCount(stats.total_media),
      icon: "M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z",
    },
  ];

  const maxPostCount = topAuthors
    ? Math.max(...topAuthors.map((a) => a.post_count), 1)
    : 1;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="card-glow rounded-2xl p-5 border"
            style={{
              background: "var(--bg-surface)",
              borderColor: "var(--border-primary)",
            }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
              style={{ background: "var(--accent-pink-muted)" }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="var(--accent-pink)"
              >
                <path d={card.icon} />
              </svg>
            </div>
            <div
              className="text-xs font-medium mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              {card.label}
            </div>
            <div
              className="text-2xl font-bold"
              style={{
                background: "var(--gradient-primary)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Two-column row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Author Leaderboard */}
        <div
          className="card-glow rounded-2xl p-5 border"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border-primary)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-lg font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {t("dashboard.topAuthors")}
            </h2>
            <div
              className="flex rounded-lg p-1 gap-1"
              style={{ background: "var(--bg-primary)" }}
            >
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className="px-3 py-1 text-xs font-medium rounded-md transition-all"
                  style={
                    period === p
                      ? {
                          background: "var(--gradient-primary)",
                          color: "#fff",
                        }
                      : {
                          background: "transparent",
                          color: "var(--text-muted)",
                        }
                  }
                >
                  {t(`dashboard.period.${p}`)}
                </button>
              ))}
            </div>
          </div>

          {!topAuthors || topAuthors.length === 0 ? (
            <div
              className="text-sm text-center py-8"
              style={{ color: "var(--text-muted)" }}
            >
              {t("dashboard.noDataForPeriod")}
            </div>
          ) : (
            <div className="space-y-3">
              {topAuthors.slice(0, 5).map((author, idx) => (
                <div key={author.author_id} className="flex items-center gap-3">
                  <span
                    className="text-xs font-bold w-5 text-center shrink-0"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {idx + 1}
                  </span>
                  {author.profile_image ? (
                    <img
                      src={author.profile_image}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: "var(--gradient-primary)" }}
                    >
                      {(author.display_name || author.username)?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-sm font-medium truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {author.display_name || author.username}
                      </span>
                      <span
                        className="text-xs shrink-0"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {t("dashboard.postsMediaShort", { posts: String(author.post_count), media: String(author.media_count) })}
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full mt-1 overflow-hidden"
                      style={{ background: "var(--bg-primary)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(author.post_count / maxPostCount) * 100}%`,
                          background: "var(--gradient-primary)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Latest Media */}
        <div
          className="card-glow rounded-2xl p-5 border"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border-primary)",
          }}
        >
          <h2
            className="text-lg font-semibold mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            {t("dashboard.latestMedia")}
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {stats.recent_media.map((m) => (
              <div
                key={m.id}
                className="aspect-square rounded-xl overflow-hidden relative"
                style={{ background: "var(--bg-primary)" }}
              >
                <img
                  src={
                    m.type === "video"
                      ? mediaThumbnailUrl(m.id)
                      : mediaFileUrl(m.id)
                  }
                  alt=""
                  className={`w-full h-full object-cover${nsfw ? "" : " sfw-blur"}`}
                />
                {m.type === "video" && (
                  <span
                    className="absolute top-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      background: "rgba(0,0,0,0.7)",
                      color: "#fff",
                    }}
                  >
                    {t("dashboard.videoBadge")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Storage card */}
      <div
        className="card-glow rounded-2xl p-5 border"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border-primary)",
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {t("dashboard.storage")}
          </h2>
          <span
            className="text-lg font-bold"
            style={{
              background: "var(--gradient-primary)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {fmtBytes(stats.storage_bytes)}
          </span>
        </div>

        <div
          className="h-3 rounded-full overflow-hidden flex"
          style={{ background: "var(--bg-primary)" }}
        >
          {stats.groups.map((group, i) => (
            <div
              key={group.id}
              style={{
                width:
                  stats.total_media > 0
                    ? `${(group.media_count / stats.total_media) * 100}%`
                    : "0%",
                background: `hsl(${(i * 60 + 330) % 360}, 80%, 60%)`,
              }}
              className="h-full"
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
          {stats.groups.map((group, i) => (
            <div key={group.id} className="flex items-center gap-1.5 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  background: `hsl(${(i * 60 + 330) % 360}, 80%, 60%)`,
                }}
              />
              <span style={{ color: "var(--text-muted)" }}>
                {group.name}
              </span>
              <span style={{ color: "var(--text-primary)" }}>
                {group.media_count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
