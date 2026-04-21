import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { fetchTasks, triggerFetchAll } from "../api/tasks";
import { useTaskWebSocket } from "../hooks/useWebSocket";
import type { TaskStatus } from "../types";
import TaskProgress from "./TaskProgress";

export default function TaskList() {
  const { t } = useTranslation();
  const { data: httpTasks } = useQuery({ queryKey: ["tasks"], queryFn: fetchTasks, refetchInterval: 5000 });
  const wsTasks = useTaskWebSocket();
  const fetchAllMutation = useMutation({ mutationFn: triggerFetchAll });

  const taskMap = new Map<string, TaskStatus>();
  httpTasks?.forEach((t) => taskMap.set(t.id, t));
  wsTasks.forEach((t) => taskMap.set(t.id, t));
  const allTasks = Array.from(taskMap.values()).sort((a, b) => new Date(b.started_at ?? 0).getTime() - new Date(a.started_at ?? 0).getTime());

  const hasRunning = allTasks.some((t) => t.status === "running" || t.status === "pending");

  return (
    <div>
      <button
        onClick={() => fetchAllMutation.mutate()}
        disabled={fetchAllMutation.isPending || hasRunning}
        className="btn-glow text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed mb-4 transition-colors"
        style={{ background: "var(--gradient-primary)" }}
      >
        {fetchAllMutation.isPending ? t("tasks.list.starting") : hasRunning ? t("tasks.list.fetching") : t("tasks.list.fetchAllActive")}
      </button>
      <div className="space-y-3">
        {allTasks.map((t) => <TaskProgress key={t.id} task={t} />)}
        {allTasks.length === 0 && <div style={{ color: "var(--text-muted)" }}>{t("tasks.list.empty")}</div>}
      </div>
    </div>
  );
}
