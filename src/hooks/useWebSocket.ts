import { useEffect, useRef, useState } from "react";
import type { TaskStatus } from "../types";

export function useTaskWebSocket() {
  const [tasks, setTasks] = useState<Record<string, TaskStatus>>({});
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
    const wsUrl = apiBase.replace(/^http/, "ws").replace(/\/api$/, "/api/ws/tasks");
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "task_update") {
        setTasks((prev) => ({ ...prev, [data.task.id]: data.task }));
      }
    };

    ws.onclose = () => {
      setTimeout(() => {
        wsRef.current = null;
      }, 3000);
    };

    return () => {
      ws.close();
    };
  }, []);

  return Object.values(tasks);
}
