import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchTasks, triggerFetchAll } from "../api/tasks";
import { useTaskWebSocket } from "../hooks/useWebSocket";
import type { TaskStatus } from "../types";
import TaskProgress from "./TaskProgress";

export default function TaskList() {
  const { data: httpTasks } = useQuery({ queryKey: ["tasks"], queryFn: fetchTasks, refetchInterval: 5000 });
  const wsTasks = useTaskWebSocket();
  const fetchAllMutation = useMutation({ mutationFn: triggerFetchAll });
  const taskMap = new Map<string, TaskStatus>();
  httpTasks?.forEach((t) => taskMap.set(t.id, t));
  wsTasks.forEach((t) => taskMap.set(t.id, t));
  const allTasks = Array.from(taskMap.values()).sort((a, b) => new Date(b.started_at ?? 0).getTime() - new Date(a.started_at ?? 0).getTime());
  return (
    <div>
      <button onClick={() => fetchAllMutation.mutate()} disabled={fetchAllMutation.isPending} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mb-4">{fetchAllMutation.isPending ? "Starting..." : "Fetch All Active"}</button>
      <div className="space-y-3">
        {allTasks.map((t) => <TaskProgress key={t.id} task={t} />)}
        {allTasks.length === 0 && <div className="text-gray-500">No tasks yet.</div>}
      </div>
    </div>
  );
}
