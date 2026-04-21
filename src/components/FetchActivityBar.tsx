import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { TaskStatus } from "../types";

interface Props {
  tasks: TaskStatus[];
}

export default function FetchActivityBar({ tasks }: Props) {
  const { t } = useTranslation();

  const phaseLabel = (task: TaskStatus): string => {
    const base = t(`fetchActivity.phases.${task.phase as "downloading" | "processing" | "saving" | "done"}`, { defaultValue: task.phase });
    if (task.phase === "downloading" && task.progress > 0) {
      return base + t("fetchActivity.phaseFilesSuffix", { count: task.progress });
    }
    if ((task.phase === "processing" || task.phase === "saving") && task.total > 0) {
      return base + t("fetchActivity.phaseItemsSuffix", { count: task.total });
    }
    return base;
  };
  const running = tasks.filter((task) => task.status === "running" || task.status === "pending");
  const [completedSnapshot, setCompletedSnapshot] = useState<TaskStatus[] | null>(null);
  const [expanded, setExpanded] = useState(false);
  const prevRunningCount = useRef(0);

  useEffect(() => {
    if (prevRunningCount.current > 0 && running.length === 0) {
      const completed = tasks.filter((task) => task.status === "completed");
      if (completed.length > 0) {
        setCompletedSnapshot(completed);
        const timer = setTimeout(() => setCompletedSnapshot(null), 3000);
        return () => clearTimeout(timer);
      }
    }
    prevRunningCount.current = running.length;
  }, [running.length, tasks]);

  const isActive = running.length > 0;
  const showComplete = !isActive && completedSnapshot !== null;

  if (!isActive && !showComplete) return null;

  const totalDownloaded = running.reduce((sum, task) => sum + (task.progress || 0), 0);
  const errors = tasks.filter((task) => task.status === "error");

  return (
    <div className="relative flex-shrink-0">
      {isActive && (
        <div className="h-1 w-full overflow-hidden" style={{ background: "var(--bg-primary)" }}>
          <div
            className="h-full animate-shimmer"
            style={{ background: "linear-gradient(90deg, var(--accent-pink), var(--accent-cyan), var(--accent-pink))" }}
          />
        </div>
      )}

      {showComplete && (
        <div className="h-1 w-full animate-fade-out" style={{ background: "var(--accent-cyan)" }} />
      )}

      <div
        className="flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer select-none transition-colors border-b"
        style={
          isActive
            ? { background: "var(--accent-pink-muted)", borderColor: "var(--border-primary)", color: "var(--accent-pink)" }
            : { background: "var(--accent-cyan-muted)", borderColor: "var(--border-primary)", color: "var(--accent-cyan)" }
        }
        onClick={() => isActive && setExpanded((e) => !e)}
      >
        {isActive ? (
          <>
            <div className="relative flex h-5 w-5 items-center justify-center flex-shrink-0">
              <div className="absolute h-5 w-5 rounded-full animate-ping" style={{ background: "var(--accent-pink)", opacity: 0.3 }} />
              <div className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--accent-pink)" }} />
            </div>
            <span className="font-medium">
              {running.length === 1 ? t("fetchActivity.headerOne") : t("fetchActivity.headerMany", { count: running.length })}
            </span>
            {totalDownloaded > 0 && (
              <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                {t("fetchActivity.filesDownloaded", { count: totalDownloaded })}
              </span>
            )}
            <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>
              {running.slice(0, 3).map((task) => `@${task.author_username}`).join(", ")}
              {running.length > 3 && ` +${running.length - 3}`}
            </span>
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`w-4 h-4 ml-1 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            >
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </>
        ) : (
          <>
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0" style={{ color: "var(--accent-cyan)" }}>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">
              {t("fetchActivity.complete", { count: completedSnapshot!.reduce((s, task) => s + (task.total || 0), 0) })}
            </span>
          </>
        )}
      </div>

      {isActive && expanded && (
        <div
          className="border-b px-4 py-2 space-y-2"
          style={{ borderColor: "var(--border-primary)", background: "var(--bg-surface)" }}
        >
          {running.map((task) => (
            <div key={task.id} className="space-y-1">
              <div className="flex items-center gap-3 text-sm">
                <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "var(--accent-pink)" }} />
                <span className="font-medium" style={{ color: "var(--text-primary)" }}>@{task.author_username}</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{phaseLabel(task)}</span>
              </div>
              <div className="flex items-center gap-2 ml-[18px]">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-primary)" }}>
                  {task.phase === "downloading" ? (
                    <div
                      className="h-full rounded-full animate-indeterminate"
                      style={{ background: "var(--accent-pink)" }}
                    />
                  ) : task.phase === "saving" ? (
                    <div
                      className="h-full rounded-full animate-indeterminate"
                      style={{ background: "var(--accent-cyan)" }}
                    />
                  ) : (
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ background: "var(--gradient-primary)", width: "100%" }}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
          {errors.map((task) => (
            <div key={task.id} className="flex items-center gap-3 text-sm">
              <div className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--badge-error-text)" }} />
              <span className="font-medium" style={{ color: "var(--badge-error-text)" }}>@{task.author_username}</span>
              <span style={{ color: "var(--text-muted)" }}>{task.error}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
