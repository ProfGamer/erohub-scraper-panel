import type { TaskStatus } from "../types";

export default function TaskProgress({ task }: { task: TaskStatus }) {
  const statusColor = task.status === "running" ? "text-blue-600" : task.status === "completed" ? "text-green-600" : task.status === "error" ? "text-red-600" : "text-gray-500";
  return (
    <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
      <div className="flex-1">
        <div className="font-semibold">@{task.author_username}</div>
        <div className={`text-sm ${statusColor}`}>{task.status}</div>
        {task.error && <div className="text-xs text-red-500 mt-1">{task.error}</div>}
      </div>
      {task.status === "running" && <div className="text-sm text-gray-500">{task.progress} / {task.total || "..."}</div>}
      {task.status === "completed" && <div className="text-sm text-green-600">{task.total} items</div>}
    </div>
  );
}
