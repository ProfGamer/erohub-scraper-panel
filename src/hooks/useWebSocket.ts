import { useEffect, useRef, useState, useCallback } from "react";
import type { TaskStatus } from "../types";

interface UseTaskWebSocketOptions {
  onTaskCompleted?: (task: TaskStatus) => void;
}

export function useTaskWebSocket(options?: UseTaskWebSocketOptions) {
  const [tasks, setTasks] = useState<Record<string, TaskStatus>>({});
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const onCompletedRef = useRef(options?.onTaskCompleted);
  onCompletedRef.current = options?.onTaskCompleted;

  const connect = useCallback(() => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
    const wsUrl = apiBase.replace(/^http/, "ws").replace(/\/api$/, "/api/ws/tasks");
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "task_update") {
        const task = data.task as TaskStatus;
        setTasks((prev) => ({ ...prev, [task.id]: task }));
        if (task.status === "completed" && onCompletedRef.current) {
          onCompletedRef.current(task);
        }
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => ws.close();
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return Object.values(tasks);
}
