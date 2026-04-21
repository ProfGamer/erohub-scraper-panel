import { useTranslation } from "react-i18next";
import type { TaskStatus } from "../types";

export default function TaskProgress({ task }: { task: TaskStatus }) {
  const { t } = useTranslation();
  const statusStyle =
    task.status === "running"
      ? { color: "var(--accent-pink)" }
      : task.status === "completed"
        ? { color: "var(--badge-active-text)" }
        : task.status === "error"
          ? { color: "var(--badge-error-text)" }
          : { color: "var(--text-muted)" };

  return (
    <div
      className="card-glow rounded-2xl p-4 flex items-center gap-4 border transition-colors duration-300"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border-primary)" }}
    >
      <div className="flex-1">
        <div className="font-semibold" style={{ color: "var(--text-primary)" }}>@{task.author_username}</div>
        <div className="text-sm" style={statusStyle}>{t(`tasks.progress.status.${task.status as "pending" | "running" | "completed" | "error"}`)}</div>
        {task.error && <div className="text-xs mt-1" style={{ color: "var(--badge-error-text)" }}>{task.error}</div>}
      </div>
      {task.status === "running" && <div className="text-sm" style={{ color: "var(--text-muted)" }}>{task.progress} / {task.total || "..."}</div>}
      {task.status === "completed" && <div className="text-sm" style={{ color: "var(--badge-active-text)" }}>{t("tasks.progress.completedItems", { count: task.total })}</div>}
    </div>
  );
}
